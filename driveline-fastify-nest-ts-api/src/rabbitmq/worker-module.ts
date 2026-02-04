import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MicroserviceRetryInterceptor } from 'src/rest/flow-control/interceptors/retry.interceptor';
import { AppConfigModule } from 'src/common/utils/AppConfigService';
import { StripeModule } from 'src/rabbitmq/stripe/stripe.module';
import { ClickHouseModule } from './analytics/clickHouse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClickHouseModule,
    AppConfigModule,
    StripeModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MicroserviceRetryInterceptor,
    },
  ],
})
export class WorkerModule {}
