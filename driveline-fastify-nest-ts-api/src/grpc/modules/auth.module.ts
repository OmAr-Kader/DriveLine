import { Module } from '@nestjs/common';
import { AuthService } from 'src/grpc/services/auth.service';
import { AppConfigService } from 'src/common/utils/AppConfigService';
import { ConfigService } from '@nestjs/config';
import { EmailSchedulerService } from 'src/rabbitmq/email/email-scheduler.service';
import { NodemailerTransport } from 'src/rabbitmq/email/email.transport';
import { AuthController } from '../controllers/auth.controller';

@Module({
  providers: [
    AuthService,
    EmailSchedulerService,
    // Provide a default mailer. In your app module override this provider with a production implementation.
    {
      provide: 'IMailer',
      useFactory: (cfg: ConfigService) => new NodemailerTransport(new AppConfigService(cfg)),
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, EmailSchedulerService],
})
export class AuthModule {}
