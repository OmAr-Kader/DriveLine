import { Injectable, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import Agenda from 'agenda';
import { ConfigService } from '@nestjs/config';
import { AGENDA_COLLECTION, AgendaJobHandler, AgendaJobResult } from './agenda.constants';
import { LoggerKit } from 'src/common/utils/LogKit';

@Injectable()
export class AgendaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = LoggerKit.create(AgendaService.name);
  private agenda: Agenda | null = null;

  // Keep a simple started flag to avoid double starts
  private started = false;

  constructor(private readonly configService: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    const mongoUri = this.configService.get<string>('MONGODB_URI');
    if (!mongoUri) {
      throw new ServiceUnavailableException('MONGODB_URI is required for AgendaService');
    }

    // Create Agenda instance
    this.agenda = new Agenda({
      db: { address: mongoUri, collection: AGENDA_COLLECTION },
      processEvery: this.configService.get<string>('AGENDA_PROCESS_EVERY') || '30 seconds',
      defaultLockLifetime: Number(this.configService.get<number>('AGENDA_LOCK_LIFETIME')),
    });

    // Wire basic error logging
    this.agenda.on('error', (err: Error) => {
      this.logger?.error('Agenda error', err);
    });

    // Start agenda
    await this.start();
    this.logger?.log('Agenda initialized and started');
  }

  public async onModuleDestroy(): Promise<void> {
    if (!this.agenda) return;
    this.logger?.log('Stopping Agenda...');
    // shutdown waits for currently running jobs to finish
    await this.agenda.stop();
    this.started = false;
    this.logger?.log('Agenda stopped');
  }

  private async start(): Promise<void> {
    if (!this.agenda || this.started) return;
    await this.agenda.start();
    this.started = true;
  }

  /**
   * Define a named job / handler. Job handlers should be idempotent and robust.
   * You can register them from other modules (for example EmailSchedulerService registers 'send-email').
   */
  public define<T = any>(name: string, handler: AgendaJobHandler<T>): void {
    if (!this.agenda) {
      throw new ServiceUnavailableException('Agenda is not initialized');
    }
    // Wrap handler to pass job.attrs.data
    this.agenda.define(name, async (job) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const data = (job.attrs.data ?? {}) as T;
        await handler(data);
      } catch (err) {
        this.logger?.error(`Error running job "${name}"`, err as Error);
        throw err;
      }
    });
    this.logger?.log(`Agenda job defined: ${name}`);
  }

  /**
   * Schedule a one-off job at a specific Date or cron-like time string.
   * Returns job id (string).
   */
  public async scheduleOnce<T = any>(name: string, when: Date | string, data?: T): Promise<string> {
    if (!this.agenda) throw new ServiceUnavailableException('Agenda is not initialized');
    const job = await this.agenda.schedule(when, name, data ?? {});
    await job.save();
    const id = job.attrs._id?.toHexString() ?? '';
    this.logger?.debug(`Scheduled job ${name} id=${id} at ${job.attrs.nextRunAt?.toISOString()}`);
    return id;
  }

  /**
   * Create a repeating job using a cron expression or human interval string.
   * `interval` can be a cron string like '0 8 * * *' or an interval like 'every 2 hours'
   * Returns job id (string).
   */
  public async scheduleRecurring<T = any>(name: string, interval: string, data?: T): Promise<string> {
    if (!this.agenda) throw new ServiceUnavailableException('Agenda is not initialized');
    const job = this.agenda.create(name, data ?? {});
    job.repeatEvery(interval, { skipImmediate: true }); // don't run immediately unless desired
    await job.save();
    const id = job.attrs._id?.toHexString() ?? '';
    this.logger?.debug(`Scheduled recurring job ${name} id=${id} interval=${interval}`);
    return id;
  }

  /**
   * Cancel jobs by query. Returns number of cancelled jobs.
   * Examples:
   * - cancel by name: { name: 'send-email' }
   * - cancel by name + data.prop: { name: 'send-email', 'data.emailId': '123' }
   */
  public async cancel(query: Record<string, unknown>): Promise<number | undefined> {
    if (!this.agenda) throw new ServiceUnavailableException('Agenda is not initialized');
    // agenda.cancel returns number of removed docs
    const removed = await this.agenda.cancel(query);
    this.logger?.debug(`Cancelled ${removed} jobs with query ${JSON.stringify(query)}`);
    return removed;
  }

  /**
   * Fetch scheduled jobs matching a query. Map to a safe DTO.
   */
  public async list(query: Record<string, unknown> = {}): Promise<AgendaJobResult[]> {
    if (!this.agenda) throw new ServiceUnavailableException('Agenda is not initialized');
    const jobs = await this.agenda.jobs(query);
    return jobs.map((j) => ({
      id: j.attrs._id?.toHexString() ?? '',
      name: j.attrs.name,
      nextRunAt: j.attrs.nextRunAt ?? null,
      lastRunAt: j.attrs.lastRunAt ?? null,
      lockedAt: j.attrs.lockedAt ?? null,
      failedAt: j.attrs.failedAt ?? null,
      repeatInterval: j.attrs.repeatInterval ?? null,
    }));
  }

  /**
   * Convenience: cancel by job id string (ObjectId.toHexString()).
   */
  public async cancelById(id: string): Promise<number | undefined> {
    // Agenda stores _id as ObjectId; passing string works in queries for Mongo
    return this.cancel({ _id: id });
  }

  /**
   * Get the raw Agenda instance if you need advanced operations.
   * Use cautiously.
   */
  public getRawAgenda(): Agenda {
    if (!this.agenda) throw new ServiceUnavailableException('Agenda is not initialized');
    return this.agenda;
  }
}
