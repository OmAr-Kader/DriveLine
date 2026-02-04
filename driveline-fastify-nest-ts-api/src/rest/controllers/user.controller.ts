import {
  Controller,
  Get,
  Param,
  Body,
  Delete,
  Patch,
  Headers,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Query,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { User } from 'src/common/schema/user.schema';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { Const, ConstCacheKey } from 'src/common/utils/Const';
import { Priority } from 'src/rest/flow-control/decorators/priority.decorator';
import { Retryable } from 'src/rest/flow-control/interceptors/retry.interceptor';
import { EditAccessGuard } from 'src/common/utils/editGuard';
import { safeCompare } from 'src/common/utils/env';
import { SkipAnalytics } from 'src/rest/analytics/analytics.interceptor';
import { GrpcClientService } from 'src/rest/services/grpc-client.service';
import { CacheResult } from 'src/rest/cache/cache.interceptor';
import { BaseHeaders, BaseQueries } from 'src/common/dto/common.dto';
import { TransformedHeader, TransformedQuery } from 'src/common/types/fastify-type';
import type { ICacheStore } from '../cache/cache.helper';

@Controller('users')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class UserController {
  constructor(
    private readonly grpcClient: GrpcClientService,
    @Inject(ConstCacheKey.CACHE_STORE) private readonly cacheStore: ICacheStore,
  ) {}

  @Get('all')
  @Priority('low')
  async findAll(@Query('search') search: string | undefined, @TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (queries.skip === undefined) {
      throw new BadRequestException('skip query parameter is required');
    }
    return await this.grpcClient.runThisServiceOnce(this.grpcClient.user.FindAll({ search, queries }));
  }

  @Get('profile/:id')
  @CacheResult(ConstCacheKey.CACHE_KEY_ID_QUERY_COLUMNS, 'user:profile', 600, true)
  @Priority('critical')
  async getProfileById(
    @Param('id') id: string,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
    @TransformedHeader(BaseHeaders) _headers: BaseHeaders,
  ) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }
    const clientKeyBase64 = _headers.cryptoMode ? await this.cacheStore.getClientPublicKey(_headers.currentUserId) : undefined;
    if (_headers.cryptoMode && !clientKeyBase64) {
      throw new InternalServerErrorException('Encryption failed');
    }
    const headers: BaseHeaders = {
      ..._headers,
      clientKeyBase64,
    };

    return await this.grpcClient.runThisServiceOnce(
      this.grpcClient.user.GetProfileById({
        id,
        queries,
        headers,
      }),
    );
  }

  @Get('identify/:id')
  @Priority('critical')
  @Retryable()
  async findOne(
    @Param('id') id: string,
    @Query('columns') columns: string | undefined,
    @Query('exclude') exclude: string | undefined,
    @Headers(Const.UserID) userId: string,
  ) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }
    return await this.grpcClient.runThisServiceOnce(
      this.grpcClient.user.FindById({
        id,
        currentUser: userId,
        columns,
        exclude,
      }),
    );
  }

  @Patch('identify/:id')
  @Priority('medium')
  async patch(@Param('id') id: string, @Body() data: Partial<User> | undefined, @Headers(Const.UserID) userId: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }
    if (!data) {
      throw new BadRequestException('update data required');
    }
    if (id !== userId) throw new ForbiddenException('User identity mismatch To Edit');

    return await this.grpcClient.runThisServiceOnce(this.grpcClient.user.Update({ id, data }));
  }

  @Delete('identify/:id')
  async remove(@Param('id') id: string, @Headers(Const.UserID) userId: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }

    if (!safeCompare(id, userId)) throw new ForbiddenException('User identity mismatch To Delete');
    return await this.grpcClient.runThisServiceOnce(this.grpcClient.user.Delete({ id }));
  }

  @Patch(':id/admin')
  @Priority('medium')
  @UseGuards(EditAccessGuard)
  @SkipAnalytics()
  async updateAdmin(@Param('id') id: string, @Body() data: Partial<User>) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }
    return await this.grpcClient.runThisServiceOnce(this.grpcClient.user.Update({ id, data }));
  }

  @Delete(':id/admin')
  @UseGuards(EditAccessGuard)
  @SkipAnalytics()
  async removeByAdmin(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('user id required');
    }
    return await this.grpcClient.runThisServiceOnce(this.grpcClient.user.Delete({ id }));
  }
}
