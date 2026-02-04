import { Injectable, OnModuleInit, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ErrorLogEvent, HttpRequestEvent, UserActivityEvent } from '../../common/analytics/analytics-query.dto';
import { LoggerKit } from 'src/common/utils/LogKit';
import { ConfigService } from '@nestjs/config';
import { CLICKHOUSE_INIT_SQL } from '../../common/analytics/clickhouse-init';

interface BatchQueue<T> {
  data: T[];
  size: number;
  maxSize: number;
}

interface FlushMetrics {
  successCount: number;
  failureCount: number;
  lastFlushTime: number;
  totalFlushed: number;
}

/**
 * Lightweight async mutex to protect batch mutations from async interleaving.
 */
class SimpleMutex {
  private _locked = false;
  private _waiters: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    await new Promise<void>((resolve) => this._waiters.push(resolve));
    this._locked = true;
  }

  release(): void {
    const next = this._waiters.shift();
    if (next) next();
    else this._locked = false;
  }
}

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = LoggerKit.create(ClickHouseService.name);
  private client: ClickHouseClient | null = null;

  // Optimized batch queues with memory limits
  private readonly requestBatch: BatchQueue<HttpRequestEvent>;
  private readonly activityBatch: BatchQueue<UserActivityEvent>;
  private readonly errorBatch: BatchQueue<ErrorLogEvent>;

  // Per-batch mutexes to prevent async interleaving races
  private readonly requestMutex: SimpleMutex = new SimpleMutex();
  private readonly activityMutex: SimpleMutex = new SimpleMutex();
  private readonly errorMutex: SimpleMutex = new SimpleMutex();

  // Flush control
  private flushInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private isFlushing = false; // Prevent concurrent flushes
  // Per-batch flushing guards to avoid concurrent flushes on the same queue
  private isRequestFlushing = false;
  private isActivityFlushing = false;
  private isErrorFlushing = false;

  // Configuration
  private readonly enabled: boolean;
  private readonly batchSize: number;
  private readonly maxMemoryMB: number;

  // Metrics
  private readonly metrics: Record<string, FlushMetrics> = {
    requests: { successCount: 0, failureCount: 0, lastFlushTime: 0, totalFlushed: 0 },
    activities: { successCount: 0, failureCount: 0, lastFlushTime: 0, totalFlushed: 0 },
    errors: { successCount: 0, failureCount: 0, lastFlushTime: 0, totalFlushed: 0 },
  };

  get generateEventTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
  }

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('CLICKHOUSE_ENABLED', 'true') === 'true';
    this.batchSize = this.configService.get<number>('CLICKHOUSE_BATCH_SIZE', 100);
    this.maxMemoryMB = this.configService.get<number>('CLICKHOUSE_MAX_MEMORY_MB', 50);

    // Initialize batch queues with memory-safe defaults
    const maxBatchSize = Math.max(this.batchSize * 2, 500);
    this.requestBatch = { data: [], size: 0, maxSize: maxBatchSize };
    this.activityBatch = { data: [], size: 0, maxSize: maxBatchSize };
    this.errorBatch = { data: [], size: 0, maxSize: maxBatchSize };
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger?.warn('ClickHouse analytics is disabled');
      return;
    }

    try {
      const config = this.getConfig();

      this.client = createClient({
        url: config.url,
        username: config.username,
        password: config.password,
        request_timeout: 30000,
        max_open_connections: 10,
        compression: {
          response: config.compressionEnabled,
          request: config.compressionEnabled,
        },
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 0,
          async_insert_busy_timeout_ms: 1000,
          // Optimize batch inserts
          max_insert_block_size: String(this.batchSize),
          min_insert_block_size_rows: String(Math.floor(this.batchSize / 2)),

          // Enable query result caching on server side
          query_cache_nondeterministic_function_handling: 'ignore',
          // Optimize for parallel query execution
          max_threads: this.configService.get<number>('CLICKHOUSE_MAX_THREADS', 4),
          // Reduce memory usage
          max_memory_usage: `${10 * 1024 * 1024 * 1024}`, // max memory usage is 10GB
        },
      });

      // Initialize database schema
      await this.initializeSchema();

      await this.client.ping();
      this.logger?.log('✅ ClickHouse connected successfully');

      // Start periodic flush with optimized interval
      this.startPeriodicFlush(config.flushIntervalMs);
    } catch (error) {
      this.logger?.error('Failed to initialize ClickHouse client', error);
      this.client = null;
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.client) return;

    //await this.client.exec({ query: 'DROP DATABASE IF EXISTS analytics;' });
    const statements = CLICKHOUSE_INIT_SQL()
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sql of statements) {
      await this.client.exec({ query: sql });
    }
  }

  getConfig(): ClickHouseConfig {
    return {
      url: this.configService.get<string>('CLICKHOUSE_URL', 'http://global-clickhouse:8123'),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
      compressionEnabled: this.configService.get<boolean>('CLICKHOUSE_COMPRESSION', true),
      batchSize: this.batchSize,
      flushIntervalMs: this.configService.get<number>('CLICKHOUSE_FLUSH_INTERVAL', 5000),
      retryAttempts: this.configService.get<number>('CLICKHOUSE_RETRY_ATTEMPTS', 3),
      retryDelayMs: this.configService.get<number>('CLICKHOUSE_RETRY_DELAY', 1000),
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.logger?.log('🛑 Starting ClickHouse graceful shutdown...');
    this.isShuttingDown = true;

    // Take a consistent pre-shutdown health snapshot before any flush/cleanup
    try {
      const preShutdown = await this.healthCheck();
      this.logger?.log(`Pre-shutdown health: healthy=${preShutdown.healthy}, queueSize=${preShutdown.queueSize}`);
    } catch (err) {
      this.logger?.warn('Failed to collect pre-shutdown health snapshot', err);
    }

    // Stop accepting new events and stop periodic flush timer
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // CRITICAL FIX: Flush all remaining batches with retry
    await this.flushAllWithRetry(3, 1000);

    // Log metrics before shutdown
    this.logMetrics();

    if (this.client) {
      await this.client.close();
      this.logger?.log('✅ ClickHouse client closed gracefully');
    }
  }

  private startPeriodicFlush(intervalMs: number): void {
    this.flushInterval = setInterval(() => {
      // Skip if already flushing or shutting down
      if (this.isFlushing || this.isShuttingDown) return;

      this.flushAll().catch((err) => {
        this.logger?.error('Periodic flush failed', err);
      });
    }, intervalMs);
  }

  /**
   * Track HTTP request (non-blocking, batched, memory-safe)
   */
  trackHttpRequest(event: HttpRequestEvent): void {
    if (!this.enabled || !this.client || this.isShuttingDown) {
      return;
    }

    void (async () => {
      let shouldFlush = false;

      try {
        await this.requestMutex.acquire();

        if (this.requestBatch.size >= this.requestBatch.maxSize) {
          // Mark for emergency flush; do not mutate the batch
          shouldFlush = true;
        } else {
          this.requestBatch.data.push(event);
          this.requestBatch.size++;
          if (this.requestBatch.size >= this.batchSize) shouldFlush = true;
        }
      } catch (error) {
        this.logger?.debug('Failed to track HTTP request', error);
        this.metrics.requests.failureCount++;
        return;
      } finally {
        this.requestMutex.release();
      }

      if (shouldFlush) {
        if (this.requestBatch.size >= this.requestBatch.maxSize) {
          this.logger?.warn('Request batch full, triggering emergency flush');
        }
        void this.flushRequestBatch();
      }
    })();
  }

  /**
   * Track user activity (non-blocking, batched, memory-safe)
   */
  trackUserActivity(event: UserActivityEvent): void {
    if (!this.enabled || !this.client || this.isShuttingDown) {
      return;
    }

    void (async () => {
      let shouldFlush = false;

      try {
        await this.activityMutex.acquire();

        if (this.activityBatch.size >= this.activityBatch.maxSize) {
          // Batch full: explicitly drop the incoming event and record it
          this.logger?.warn('Activity batch full, dropping incoming event and triggering emergency flush');
          this.metrics.activities.failureCount++;
          shouldFlush = true;
        } else {
          this.activityBatch.data.push(event);
          this.activityBatch.size++;
          if (this.activityBatch.size >= this.batchSize) shouldFlush = true;
        }
      } catch (error) {
        this.logger?.debug('Failed to track user activity', error);
        this.metrics.activities.failureCount++;
        return;
      } finally {
        this.activityMutex.release();
      }

      if (shouldFlush) {
        if (this.activityBatch.size >= this.activityBatch.maxSize) {
          this.logger?.warn('Activity batch full, triggering emergency flush');
        }
        void this.flushActivityBatch();
      }
    })();
  }

  /**
   * Log error (non-blocking, batched, memory-safe)
   */
  logError(event: ErrorLogEvent): void {
    if (!this.enabled || !this.client || this.isShuttingDown) {
      return;
    }

    void (async () => {
      let shouldFlush = false;

      try {
        await this.errorMutex.acquire();

        if (this.errorBatch.size >= this.errorBatch.maxSize) {
          shouldFlush = true;
        } else {
          this.errorBatch.data.push(event);
          this.errorBatch.size++;
          if (this.errorBatch.size >= this.batchSize) shouldFlush = true;
        }
      } catch (error) {
        this.logger?.debug('Failed to log error', error);
        this.metrics.errors.failureCount++;
        return;
      } finally {
        this.errorMutex.release();
      }

      if (shouldFlush) {
        if (this.errorBatch.size >= this.errorBatch.maxSize) {
          this.logger?.warn('Error batch full, triggering emergency flush');
        }
        void this.flushErrorBatch();
      }
    })();
  }

  /**
   * OPTIMIZED: Flush with atomic swap to prevent data loss
   */
  private async flushRequestBatch(): Promise<void> {
    if (!this.client) return;

    if (this.isRequestFlushing) {
      this.logger?.debug('Request flush already in progress, skipping');
      return;
    }
    this.isRequestFlushing = true;

    try {
      let batch: HttpRequestEvent[] = [];
      let batchSize = 0;
      let hasData = false;

      // Atomic swap under mutex
      await this.requestMutex.acquire();
      try {
        if (this.requestBatch.size === 0) {
          hasData = false;
        } else {
          batchSize = this.requestBatch.size;
          batch = this.requestBatch.data.splice(0, batchSize);
          this.requestBatch.size -= batchSize;
          hasData = true;
        }
      } finally {
        this.requestMutex.release();
      }

      if (!hasData || batch.length === 0) return;

      const startTime = Date.now();

      try {
        await this.client.insert({
          table: 'analytics.http_requests',
          values: batch,
          format: 'JSONEachRow',
        });

        this.metrics.requests.successCount++;
        this.metrics.requests.totalFlushed += batch.length;
        this.metrics.requests.lastFlushTime = Date.now();

        const duration = Date.now() - startTime;
        this.logger?.debug(`✅ Flushed ${batch.length} HTTP requests in ${duration}ms`);
      } catch (error) {
        this.metrics.requests.failureCount++;
        // CRITICAL: Re-queue failed batch (up to max size) under mutex to avoid races
        await this.requestMutex.acquire();
        try {
          if (batch.length + this.requestBatch.size < this.requestBatch.maxSize) {
            this.requestBatch.data.unshift(...batch);
            this.requestBatch.size += batch.length;
          } else {
            this.logger?.error(`⚠️ Dropping ${batch.length} events - queue full`);
          }
        } finally {
          this.requestMutex.release();
        }
        this.logger?.error(`❌ Failed to insert ${batchSize} HTTP request events`, error);
      }
    } finally {
      this.isRequestFlushing = false;
    }
  }

  private async flushActivityBatch(): Promise<void> {
    if (!this.client) return;

    if (this.isActivityFlushing) {
      this.logger?.debug('Activity flush already in progress, skipping');
      return;
    }
    this.isActivityFlushing = true;

    try {
      let batch: UserActivityEvent[] = [];
      let batchSize = 0;

      await this.activityMutex.acquire();
      try {
        if (this.activityBatch.size === 0) return;
        batchSize = this.activityBatch.size;
        batch = this.activityBatch.data.splice(0, batchSize);
        this.activityBatch.size -= batchSize;
      } finally {
        this.activityMutex.release();
      }

      if (batch.length === 0) return;

      const startTime = Date.now();

      try {
        await this.client.insert({
          table: 'analytics.user_activities',
          values: batch,
          format: 'JSONEachRow',
        });

        this.metrics.activities.successCount++;
        this.metrics.activities.totalFlushed += batch.length;
        this.metrics.activities.lastFlushTime = Date.now();

        const duration = Date.now() - startTime;
        this.logger?.debug(`✅ Flushed ${batch.length} user activities in ${duration}ms`);
      } catch (error) {
        this.metrics.activities.failureCount++;
        this.logger?.error(`❌ Failed to insert ${batchSize} user activity events`, error);

        // Re-queue safely under mutex
        await this.activityMutex.acquire();
        try {
          if (batch.length + this.activityBatch.size < this.activityBatch.maxSize) {
            this.activityBatch.data.unshift(...batch);
            this.activityBatch.size += batch.length;
          } else {
            this.logger?.error(`⚠️ Dropping ${batch.length} events - queue full`);
          }
        } finally {
          this.activityMutex.release();
        }
      }
    } finally {
      this.isActivityFlushing = false;
    }
  }

  private async flushErrorBatch(): Promise<void> {
    if (!this.client) return;

    if (this.isErrorFlushing) {
      this.logger?.debug('Error flush already in progress, skipping');
      return;
    }
    // Check batch size before acquiring mutex to avoid early return inside critical section
    if (this.errorBatch.size === 0) return;
    this.isErrorFlushing = true;

    try {
      let batch: ErrorLogEvent[] = [];
      let batchSize = 0;

      await this.errorMutex.acquire();
      try {
        batchSize = this.errorBatch.size;
        batch = this.errorBatch.data.splice(0, batchSize);
        this.errorBatch.size -= batchSize;
      } finally {
        this.errorMutex.release();
      }

      if (batch.length === 0) return;

      const startTime = Date.now();

      try {
        await this.client.insert({
          table: 'analytics.error_logs',
          values: batch,
          format: 'JSONEachRow',
        });

        this.metrics.errors.successCount++;
        this.metrics.errors.totalFlushed += batch.length;
        this.metrics.errors.lastFlushTime = Date.now();

        const duration = Date.now() - startTime;
        this.logger?.debug(`✅ Flushed ${batch.length} error logs in ${duration}ms`);
      } catch (error) {
        this.metrics.errors.failureCount++;
        this.logger?.error(`❌ Failed to insert ${batchSize} error log events`, error);

        // Re-queue safely under mutex
        await this.errorMutex.acquire();
        try {
          if (batch.length + this.errorBatch.size < this.errorBatch.maxSize) {
            this.errorBatch.data.unshift(...batch);
            this.errorBatch.size += batch.length;
          } else {
            this.logger?.error(`⚠️ Dropping ${batch.length} events - queue full`);
          }
        } finally {
          this.errorMutex.release();
        }
      }
    } finally {
      this.isErrorFlushing = false;
    }
  }

  /**
   * CRITICAL FIX: Prevent concurrent flushes with mutex
   */
  private async flushAll(): Promise<void> {
    if (this.isFlushing) {
      this.logger?.debug('Flush already in progress, skipping');
      return;
    }

    this.isFlushing = true;

    try {
      await Promise.allSettled([this.flushRequestBatch(), this.flushActivityBatch(), this.flushErrorBatch()]);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * CRITICAL FIX: Retry mechanism for shutdown flush
   */
  private async flushAllWithRetry(attempts: number, delayMs: number): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      try {
        await this.flushAll();

        const remainingEvents = this.requestBatch.size + this.activityBatch.size + this.errorBatch.size;

        if (remainingEvents === 0) {
          this.logger?.log('✅ All events flushed successfully');
          return;
        }

        if (i < attempts - 1) {
          this.logger?.warn(`⚠️ ${remainingEvents} events remaining, retry ${i + 1}/${attempts}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        this.logger?.error(`Flush retry ${i + 1} failed`, error);
        if (i === attempts - 1) {
          const lostEvents = this.requestBatch.size + this.activityBatch.size + this.errorBatch.size;
          this.logger?.error(`❌ Failed to flush ${lostEvents} events after ${attempts} attempts`);
        }
      }
    }
  }

  private logMetrics(): void {
    this.logger?.log('📊 ClickHouse Metrics:');
    this.logger?.log(`  Requests: ${this.metrics.requests.totalFlushed} flushed, ${this.metrics.requests.failureCount} failures`);
    this.logger?.log(`  Activities: ${this.metrics.activities.totalFlushed} flushed, ${this.metrics.activities.failureCount} failures`);
    this.logger?.log(`  Errors: ${this.metrics.errors.totalFlushed} flushed, ${this.metrics.errors.failureCount} failures`);
  }

  /**
   * Query analytics data with parameterized queries (SQL injection safe)
   */
  async query<T = any>(sql: string, params?: Record<string, any>): Promise<T[]> {
    if (!this.client) {
      throw new ServiceUnavailableException('ClickHouse client not initialized');
    }

    try {
      const result = await this.client.query({
        query: sql,
        query_params: params,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger?.error('Query failed', error);
      throw error;
    }
  }

  /**
   * Health check for monitoring
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async healthCheck(): Promise<{ healthy: boolean; metrics: any; queueSize: number }> {
    const queueSize = this.requestBatch.size + this.activityBatch.size + this.errorBatch.size;

    return {
      healthy: this.client !== null && !this.isShuttingDown,
      metrics: this.metrics,
      queueSize,
    };
  }
}

export interface ClickHouseConfig {
  url: string;
  username?: string;
  password?: string;
  compressionEnabled: boolean;
  batchSize: number;
  flushIntervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}
