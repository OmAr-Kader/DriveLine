import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ANALYTICS_QUEUE_NAMES } from 'src/common/rabbitMQ/analytics_queue.constants';
import { ClickHouseService } from './clickhouse.service';
import type { HttpRequestEvent, UserActivityEvent, ErrorLogEvent } from '../../common/analytics/analytics-query.dto';

@Controller()
export class ClickHouseController {
  private readonly logger = new Logger(ClickHouseController.name);

  constructor(private readonly clickHouseService: ClickHouseService) {}

  @MessagePattern(ANALYTICS_QUEUE_NAMES.TRACK_HTTP_REQUEST)
  handleTrackHttpRequest(@Payload() payload: HttpRequestEvent) {
    this.logger.log('Received trackHttpRequest payload');
    try {
      // Fire-and-forget internal tracking
      this.clickHouseService.trackHttpRequest(payload);
      return { ok: true };
    } catch (error) {
      this.logger.error('Failed to process trackHttpRequest', error);
      return { ok: false };
    }
  }

  @MessagePattern(ANALYTICS_QUEUE_NAMES.TRACK_USER_ACTIVITY)
  handleTrackUserActivity(@Payload() payload: UserActivityEvent) {
    this.logger.log('Received trackUserActivity payload');
    try {
      this.clickHouseService.trackUserActivity(payload);
      return { ok: true };
    } catch (error) {
      this.logger.error('Failed to process trackUserActivity', error);
      return { ok: false };
    }
  }

  @MessagePattern(ANALYTICS_QUEUE_NAMES.LOG_ERROR)
  handleLogError(@Payload() payload: ErrorLogEvent) {
    this.logger.log('Received logError payload');
    try {
      this.clickHouseService.logError(payload);
      return { ok: true };
    } catch (error) {
      this.logger.error('Failed to process logError', error);
      return { ok: false };
    }
  }
}
