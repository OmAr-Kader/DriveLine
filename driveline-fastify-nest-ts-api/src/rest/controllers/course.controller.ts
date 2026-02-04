import { Controller, Get, Post, Patch, Body, Headers, Param, Query, BadRequestException, UseGuards, Delete } from '@nestjs/common';
import { Types } from 'mongoose';
import { SkipAnalytics } from 'src/rest/analytics/analytics.interceptor';
import { CreateCourse, UpdateCourse } from 'src/common/dto/course.dto';
import { Priority, SkipFlowControl } from 'src/rest/flow-control/decorators/priority.decorator';
import { Const } from 'src/common/utils/Const';
import { EditAccessGuard } from 'src/common/utils/editGuard';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { GrpcClientService } from '../services/grpc-client.service';
import { BaseQueries } from 'src/common/dto/common.dto';
import { TransformedQuery } from 'src/common/types/fastify-type';

@Controller('school')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class CourseController {
  constructor(private readonly grpc: GrpcClientService) {}

  checkDays(dto: CreateCourse | UpdateCourse) {
    const days = [dto.sunday, dto.monday, dto.tuesday, dto.wednesday, dto.thursday, dto.friday, dto.saturday];
    for (const day of days) {
      if (day?.dayOff === false && (!day.endUTC || !day.startUTC)) {
        throw new BadRequestException('Invalid availability interval: startUTC and endUTC must be provided when dayOff is false');
      }
    }
  }

  @Post('courses')
  @Priority('low')
  async create(@Body() dto: CreateCourse, @Headers(Const.UserID) userId: string) {
    if (dto.techId == null || !Types.ObjectId.isValid(dto.techId) || dto.courseAdminId == null || dto.description == null) {
      throw new BadRequestException('Invalid data');
    }
    this.checkDays(dto);
    return await this.grpc.runThisServiceOnce(this.grpc.course.Create({ course: dto, currentUser: userId }));
  }

  @Patch('courses/:id')
  @Priority('low')
  async update(@Param('id') id: string, @Body() dto: UpdateCourse, @Headers(Const.UserID) userId: string) {
    if (id == null || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    this.checkDays(dto);
    return await this.grpc.runThisServiceOnce(this.grpc.course.Update({ id, update: dto, currentUser: userId }));
  }

  @Get('courses/:id')
  @Priority('critical')
  async getOne(@Param('id') id: string, @Headers(Const.UserID) currentUserId: string) {
    if (id == null || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return await this.grpc.runThisServiceOnce(this.grpc.course.GetCourseById({ id, currentUserId }));
  }

  @Get('courses')
  @Priority('high')
  async list(
    @Query('courseAdminId') courseAdminId: number,
    @Query('isActive') isActive: string,
    @Headers(Const.UserID) userId: string,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
  ) {
    if (courseAdminId == null || isActive == null) throw new BadRequestException('Invalid data');

    return await this.grpc.runThisServiceOnce(
      this.grpc.course.GetCoursesByCourseAdminId({
        courseAdminId: Number(courseAdminId),
        isActive: isActive === 'true',
        currentUser: userId,
        queries,
      }),
    );
  }

  @Get('tech/:techId/courses')
  @Priority('high')
  async getTechServices(@Param('techId') techId: string, @Headers(Const.UserID) userId: string, @TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (techId == null || !Types.ObjectId.isValid(techId)) throw new BadRequestException('Invalid id');
    return await this.grpc.runThisServiceOnce(this.grpc.course.ListByTech({ techId, currentUser: userId, queries }));
  }

  @Get('courses/all/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  @SkipAnalytics()
  async getAll(@TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (queries.skip === undefined) {
      throw new BadRequestException('skip query parameter is required');
    }
    return await this.grpc.runThisServiceOnce(this.grpc.course.GetAllCourses({ queries: queries }));
  }

  @Delete('courses/:id/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  @SkipAnalytics()
  async removeByAdmin(@Param('id') id: string) {
    if (id == null || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('course id required');
    }
    return await this.grpc.runThisServiceOnce(this.grpc.course.Delete({ id }));
  }
}
