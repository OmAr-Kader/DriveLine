import { Injectable, OnModuleInit, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { LoggerKit } from 'src/common/utils/LogKit';
import { ConfigService } from '@nestjs/config';
import { CLICKHOUSE_INIT_SQL } from 'src/common/analytics/clickhouse-init';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = LoggerKit.create(AnalyticsService.name);
  private client: ClickHouseClient | null = null;
  private readonly enabled: boolean;

  get generateEventTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
  }

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('CLICKHOUSE_ENABLED', 'true') === 'true';
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger?.warn('ClickHouse analytics is disabled');
      return;
    }

    try {
      const config = this.getConfig();

      // Optimized for query-only operations
      this.client = createClient({
        url: config.url,
        username: config.username,
        password: config.password,
        request_timeout: config.queryTimeoutMs,
        max_open_connections: config.maxConnections,
        compression: {
          response: config.compressionEnabled,
          request: config.compressionEnabled,
        },
        // Query-specific optimizations
        clickhouse_settings: {
          // Enable query result caching on server side
          query_cache_nondeterministic_function_handling: 'ignore',
          max_query_size: `${50 * 1024 * 1024}`, // max query size is 50MB
          // Optimize for parallel query execution
          max_threads: this.configService.get<number>('CLICKHOUSE_MAX_THREADS', 4),
          // Reduce memory usage
          max_memory_usage: `${1 * 1024 * 1024 * 1024}`, // max memory usage is 1GB
        },
      });

      // Initialize database schema
      await this.initializeSchema();
      await this.client.ping();
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
      queryTimeoutMs: this.configService.get<number>('CLICKHOUSE_QUERY_TIMEOUT', 15000),
      maxConnections: this.configService.get<number>('CLICKHOUSE_MAX_CONNECTIONS', 50),
      enableCache: this.configService.get<boolean>('CLICKHOUSE_CACHE_ENABLED', true),
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.logger?.log('🛑 Starting ClickHouse graceful shutdown...');

    if (this.client) {
      await this.client.close();
      this.logger?.log('✅ ClickHouse client closed gracefully');
    }
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
}

export interface ClickHouseConfig {
  url: string;
  username?: string;
  password?: string;
  compressionEnabled: boolean;
  queryTimeoutMs: number;
  maxConnections: number;
  enableCache: boolean;
}
