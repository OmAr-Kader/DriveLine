import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Config

// Note: This webhook module does not hold DB-related entities, repositories or services.
// Database and Stripe processing logic lives in the worker-side `StripeModule`.
// HTTP Controller for Webhooks
// Middleware

// Guards
import { AppConfigModule } from 'src/common/utils/AppConfigService';
import { GracefulShutdownService } from 'src/rest/flow-control/services/shutdown-service';
import { AnalyticsInterceptor } from 'src/rest/analytics/analytics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core/constants';
import { StripeWebhookModule } from 'src/rest/webhook/stripe/stripe-webhook.module';
import { RabbitMQModule } from 'src/common/rabbitMQ/rabbitMQ.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available app-wide
    }),
    RabbitMQModule,
    AppConfigModule,
    StripeWebhookModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AnalyticsInterceptor,
    },
    GracefulShutdownService,
  ],
  exports: [GracefulShutdownService],
})
export class WebHookModule {}
