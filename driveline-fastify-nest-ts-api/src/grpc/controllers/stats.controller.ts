import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CountResponse, GetAllCountsResponse } from 'src/common/dto/stats.dto';
import { Const_GRPC_Stats, ConstGRPC } from 'src/common/utils/Const';
import { StatsService } from 'src/grpc/services/stats.service';

@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @GrpcMethod(ConstGRPC.STATS_SERVICE, Const_GRPC_Stats.CountUsers)
  async countUsers(): Promise<CountResponse> {
    const count = await this.statsService.countUsers();
    return { count };
  }

  @GrpcMethod(ConstGRPC.STATS_SERVICE, Const_GRPC_Stats.CountFixServices)
  async countFixServices(): Promise<CountResponse> {
    const count = await this.statsService.countFixServices();
    return { count };
  }

  @GrpcMethod(ConstGRPC.STATS_SERVICE, Const_GRPC_Stats.CountCourses)
  async countCourses(): Promise<CountResponse> {
    const count = await this.statsService.countCourses();
    return { count };
  }

  @GrpcMethod(ConstGRPC.STATS_SERVICE, Const_GRPC_Stats.CountShortVideos)
  async countShortVideos(): Promise<CountResponse> {
    const count = await this.statsService.countShortVideos();
    return { count };
  }

  @GrpcMethod(ConstGRPC.STATS_SERVICE, Const_GRPC_Stats.GetAllCounts)
  async getAllCounts(): Promise<GetAllCountsResponse> {
    const res = await this.statsService.getAllCounts();
    return { users: res.users, fixServices: res.fixServices, courses: res.courses, shortVideos: res.shortVideos };
  }
}
