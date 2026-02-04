import { Injectable, OnModuleInit, Inject, BadRequestException } from '@nestjs/common';
import { AGENDA_SEND_EMAIL_JOB } from '../agenda/agenda.constants';
import { AgendaService } from '../agenda/agenda.service';
import { EmailJobData } from './email-job-data.interface';
import { Resend } from 'resend';
import { LoggerKit } from 'src/common/utils/LogKit';
import { AppConfigService } from 'src/common/utils/AppConfigService';

@Injectable()
export class EmailSchedulerService implements OnModuleInit {
  private readonly logger = LoggerKit.create(EmailSchedulerService.name);
  private resend: Resend;

  constructor(
    private readonly agendaService: AgendaService,
    private readonly configService: AppConfigService,
    @Inject('IMailer') private readonly mailer: { sendMail: (opts: { to: string; subject: string; html?: string; text?: string }) => Promise<void> },
  ) {
    this.resend = new Resend(this.configService.stringValue('RESEND_API_KEY'));
  }

  public onModuleInit(): void {
    // Register the job handler (idempotent: define can be called once per process)
    this.agendaService.define<EmailJobData>(AGENDA_SEND_EMAIL_JOB, async (data) => {
      await this.handleSendEmail(data);
    });
    this.logger?.log(`Registered agenda job handler: ${AGENDA_SEND_EMAIL_JOB}`);
  }

  private async handleSendEmail(data: EmailJobData): Promise<void> {
    try {
      this.logger?.debug(`Sending email to ${data.to}, emailId=${data.emailId ?? '<none>'}`);
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: data.to,
        subject: data.subject ?? 'Subject Missing',
        html: data.html ?? '',
      });
      // MARK: NOT WORK
      //await this.mailer.sendMail({ to: data.to, subject: data.subject, html: data.html, text: data.text });

      this.logger?.log(`Email sent to ${data.to} emailId=${data.emailId ?? '<none>'}`);
    } catch (err) {
      this.logger?.error('Failed to send email job', err as Error);
      throw err; // Re-throw so Agenda can mark failure and retry if configured
    }
  }

  /**
   * Schedule a single email send for a future Date or a cron-like string.
   * Returns the agenda job id as string.
   */
  public async scheduleEmail(sendAt: Date | string, payload: EmailJobData): Promise<string> {
    // Ensure minimal validation
    if (!payload?.to || !payload?.subject) {
      throw new BadRequestException('Email payload must include "to" and "subject"');
    }
    const id = await this.agendaService.scheduleOnce<EmailJobData>(AGENDA_SEND_EMAIL_JOB, sendAt, payload);
    this.logger?.debug(`Scheduled email job id=${id} to ${payload.to} at ${sendAt.toString()}`);
    return id;
  }

  /**
   * Schedule a recurring email. interval is a cron string or human interval supported by Agenda.
   * Returns the created job id.
   */
  public async scheduleRecurringEmail(interval: string, payload: EmailJobData): Promise<string> {
    const id = await this.agendaService.scheduleRecurring<EmailJobData>(AGENDA_SEND_EMAIL_JOB, interval, payload);
    this.logger?.debug(`Scheduled recurring email job id=${id} interval=${interval}`);
    return id;
  }

  /**
   * Cancel scheduled send(s) by app-level emailId: this relies on jobs having data.emailId set.
   * Returns number of cancelled jobs.
   */
  public async cancelByEmailId(emailId: string): Promise<number | undefined> {
    if (!emailId) return 0;
    // Agenda stores job data under data field; we can query by 'data.emailId'
    const removed = await this.agendaService.cancel({ name: AGENDA_SEND_EMAIL_JOB, 'data.emailId': emailId });
    this.logger?.debug(`Cancelled ${removed} email jobs for emailId=${emailId}`);
    return removed;
  }

  /**
   * Cancel by agenda job id (returns number of cancelled jobs).
   */
  public async cancelByJobId(jobId: string): Promise<number | undefined> {
    const removed = await this.agendaService.cancelById(jobId);
    this.logger?.debug(`Cancelled ${removed} jobs with id=${jobId}`);
    return removed;
  }

  /**
   * List pending scheduled email jobs (optionally filter by emailId).
   */
  public async listScheduledEmails(emailId?: string) {
    const query: Record<string, unknown> = { name: AGENDA_SEND_EMAIL_JOB };
    if (emailId) query['data.emailId'] = emailId;
    const jobs = await this.agendaService.list(query);
    return jobs;
  }
}
