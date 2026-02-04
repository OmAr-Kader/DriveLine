import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { Priority, SkipFlowControl } from 'src/rest/flow-control/decorators/priority.decorator';
import { SkipAnalytics } from 'src/rest/analytics/analytics.interceptor';
import { GrpcClientService } from '../services/grpc-client.service';

@Controller('stats')
@SkipAnalytics()
@SkipFlowControl()
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class StatsController {
  constructor(private readonly grpc: GrpcClientService) {}

  @Get('users')
  @Priority('low')
  async countUsers() {
    return await this.grpc.runThisServiceOnce(this.grpc.stats.CountUsers({}));
  }

  @Get('fix-services')
  @Priority('low')
  async countFixServices() {
    return await this.grpc.runThisServiceOnce(this.grpc.stats.CountFixServices({}));
  }

  @Get('courses')
  @Priority('low')
  async countCourses() {
    return await this.grpc.runThisServiceOnce(this.grpc.stats.CountCourses({}));
  }

  @Get('short-videos')
  @Priority('low')
  async countShortVideos() {
    return await this.grpc.runThisServiceOnce(this.grpc.stats.CountShortVideos({}));
  }

  @Get('counts')
  @Priority('low')
  async getAllCounts() {
    return await this.grpc.runThisServiceOnce(this.grpc.stats.GetAllCounts({}));
  }
}
