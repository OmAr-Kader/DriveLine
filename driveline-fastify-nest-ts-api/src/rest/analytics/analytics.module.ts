import { Module, Global } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AnalyticsService } from './analytics.service';
import { AnalyticsInterceptor } from 'src/rest/analytics/analytics.interceptor';
import { AnalyticsController } from './analytics.controller';

@Global()
@Module({
  providers: [AnalyticsService, AnalyticsInterceptor, JwtService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsInterceptor],
})
export class AnalyticsModule {}
