/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AppConfigService } from 'src/common/utils/AppConfigService';

export interface IMailer {
  sendMail(opts: { to: string; subject: string; html?: string; text?: string }): Promise<void>;
}

/**
 * Simple Nodemailer transport implementing IMailer.
 * Swap this with your own implementation (SendGrid, SES, Mailgun, etc).
 */
export class NodemailerTransport implements IMailer {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: AppConfigService) {
    // For production replace with environment variables or DI config
    this.transporter = nodemailer.createTransport({
      host: config.stringValue('SMTP_HOST'),
      port: config.numberValue('SMTP_PORT'),
      secure: false,
      auth: {
        user: config.stringValue('SMTP_USER'),
        pass: config.stringValue('SMTP_PASS'),
      },
    });
  }

  public async sendMail(opts: { to: string; subject: string; html?: string; text?: string }): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.stringValue('SMTP_FROM') ?? 'noreply@example.com',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  }
}

export interface IMailer {
  sendMail(opts: { to: string; subject: string; html?: string; text?: string }): Promise<void>;
}

export interface MailerOptions {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
  fallbackToConsole?: boolean;
  failOnUnreachable?: boolean;
  // allow extra nodemailer options if required
  transportOptions?: SMTPTransport.Options;
}
