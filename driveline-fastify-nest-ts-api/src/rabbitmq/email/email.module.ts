import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { NodemailerTransport } from './email.transport';
import { EmailSchedulerService } from './email-scheduler.service';

@Module({
  imports: [AgendaModule],
  providers: [
    EmailSchedulerService,
    // Provide a default mailer. In your app module override this provider with a production implementation.
    { provide: 'IMailer', useClass: NodemailerTransport },
  ],
  exports: [EmailSchedulerService],
})
export class EmailModule {}
