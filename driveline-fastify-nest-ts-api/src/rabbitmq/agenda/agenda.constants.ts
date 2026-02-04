export const AGENDA_COLLECTION = 'agendaJobs';
export const AGENDA_SEND_EMAIL_JOB = 'send-email';

export interface AgendaJobResult {
  id: string;
  name: string;
  nextRunAt?: Date | null;
  lastRunAt?: Date | null;
  lockedAt?: Date | null;
  failedAt?: Date | null;
  repeatInterval?: string | null;
}

export type AgendaJobHandler<T = any> = (jobData: T, done?: (err?: Error) => void) => Promise<void> | void;
