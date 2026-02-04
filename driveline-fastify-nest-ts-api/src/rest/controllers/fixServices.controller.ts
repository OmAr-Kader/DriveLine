import { Controller, Get, Post, Patch, Body, Param, Query, Headers, BadRequestException, UseGuards, Delete } from '@nestjs/common';
import { CreateFixService, UpdateFixService } from 'src/common/dto/fixService.dto';
import { Types } from 'mongoose';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { Priority, SkipFlowControl } from 'src/rest/flow-control/decorators/priority.decorator';
import { EditAccessGuard } from 'src/common/utils/editGuard';
import { Const } from 'src/common/utils/Const';
import { GrpcClientService } from '../services/grpc-client.service';
import { TransformedQuery } from 'src/common/types/fastify-type';
import { BaseQueries } from 'src/common/dto/common.dto';

@Controller('fix-services')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class FixServicesController {
  constructor(private readonly grpc: GrpcClientService) {}

  checkDays(dto: CreateFixService | UpdateFixService) {
    const days = [dto.sunday, dto.monday, dto.tuesday, dto.wednesday, dto.thursday, dto.friday, dto.saturday];
    for (const day of days) {
      if (day?.dayOff === false && (!day.endUTC || !day.startUTC)) {
        throw new BadRequestException('Invalid availability interval: startUTC and endUTC must be provided when dayOff is false');
      }
    }
  }

  @Post('services')
  @Priority('low')
  async create(@Body() dto: CreateFixService, @Headers(Const.UserID) userId: string) {
    this.checkDays(dto);
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.Create({ service: dto, userId: userId }));
  }

  @Patch('services/:id')
  @Priority('low')
  async update(@Param('id') id: string, @Body() dto: UpdateFixService, @Headers(Const.UserID) userId: string) {
    if (id == null || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    this.checkDays(dto);
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.Update({ id: id, update: dto, userId: userId }));
  }

  @Get('services/:id')
  @Priority('critical')
  async getOne(@Param('id') id: string, @Headers(Const.UserID) userId: string) {
    if (id == null || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.GetServiceById({ id: id, currentUserId: userId }));
  }

  @Get('services')
  @Priority('high')
  async list(
    @Query('serviceAdminId') serviceAdminId: number,
    @Query('isActive') isActive: string,
    @Headers(Const.UserID) userId: string,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
  ) {
    if (serviceAdminId == null || isActive == null) throw new BadRequestException('Invalid data');
    return await this.grpc.runThisServiceOnce(
      this.grpc.fixService.GetServicesByServiceAdminId({
        serviceAdminId: Number(serviceAdminId),
        isActive: isActive === 'true',
        userId: userId,
        queries: queries,
      }),
    );
  }

  @Get('tech/:techId/services')
  @Priority('high')
  async getTechServices(@Param('techId') techId: string, @Headers(Const.UserID) userId: string, @TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (techId == null || !Types.ObjectId.isValid(techId)) throw new BadRequestException('Invalid id');
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.ListByTech({ techId: techId, userId: userId, queries: queries }));
  }

  @Get('services/all/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  async getAll(@TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (queries.skip === undefined) {
      throw new BadRequestException('skip query parameter is required');
    }
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.GetAllServices({ queries: queries }));
  }

  @Delete('services/:id/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  async removeByAdmin(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.grpc.runThisServiceOnce(this.grpc.fixService.Delete({ id: id }));
  }
}
