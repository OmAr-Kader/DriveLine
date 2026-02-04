export interface EmailJobData {
  emailId?: string; // optional app-level identifier to help cancelling
  to: string;
  subject: string;
  html?: string;
  text?: string;
  // any other meta you want to persist in the job data
  [key: string]: unknown;
}
