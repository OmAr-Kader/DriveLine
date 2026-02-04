import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Headers,
  Req,
  Body,
  UseGuards,
  Inject,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateShortVideo, UpdateTags } from 'src/common/dto/shortVideo.dto';
import type { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { Const, ConstCacheKey } from 'src/common/utils/Const';
import { Priority, SkipFlowControl } from 'src/rest/flow-control/decorators/priority.decorator';
import { EditAccessGuard } from 'src/common/utils/editGuard';
import { type ICacheStore } from 'src/rest/cache/cache.helper';
import { GrpcClientService } from 'src/rest/services/grpc-client.service';
import { BaseHeaders, BaseQueries } from 'src/common/dto/common.dto';
import { TransformedHeader, TransformedQuery } from 'src/common/types/fastify-type';

@Controller('video')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class ShortVideoController {
  constructor(
    private readonly grpc: GrpcClientService,
    @Inject(ConstCacheKey.CACHE_STORE) private readonly cacheStore: ICacheStore,
  ) {}

  @Post('shorts')
  @Priority('low')
  async create(@Body() dto: CreateShortVideo, @Headers(Const.UserID) userId: string) {
    return await this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.Create({
        video: dto,
        userId,
      }),
    );
  }

  @Patch('shorts/:id/tags')
  @Priority('low')
  updateTags(@Param('id') id: string, @Body() dto: UpdateTags, @Headers(Const.UserID) userId: string) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.UpdateTags({
        update: dto,
        userId,
        id: id,
      }),
    );
  }

  @Priority('low')
  @Post('shorts/:id/views/increment')
  incrementViews(@Param('id') id: string, @Headers(Const.UserID) userId: string) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.IncrementViews({
        id,
        currentUserId: userId,
      }),
    );
  }

  @Get('/user/:userId/shorts')
  @Priority('medium')
  async getUserShorts(
    @Param('userId') userId: string,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
    @TransformedHeader(BaseHeaders) _headers: BaseHeaders,
  ) {
    const clientKeyBase64 = _headers.cryptoMode ? await this.cacheStore.getClientPublicKey(_headers.currentUserId) : undefined;
    if (_headers.cryptoMode && !clientKeyBase64) {
      throw new InternalServerErrorException('Encryption failed');
    }
    const headers: BaseHeaders = {
      ..._headers,
      clientKeyBase64,
    };
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.GetByUserId({
        userId,
        queries,
        headers,
      }),
    );
  }

  @Get('/shorts/:id')
  @Priority('high')
  getById(@Param('id') id: string, @Headers(Const.UserID) userId: string) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.GetById({
        id,
        currentUserId: userId,
      }),
    );
  }

  @Get('/latest/shorts')
  @Priority('critical')
  async fetchLatest(
    @Req() request: FastifyRequest,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
    @TransformedHeader(BaseHeaders) _headers: BaseHeaders,
  ) {
    const clientKeyBase64 = _headers.cryptoMode ? await this.cacheStore.getClientPublicKey(_headers.currentUserId) : undefined;
    if (_headers.cryptoMode && !clientKeyBase64) {
      throw new InternalServerErrorException('Encryption failed');
    }
    this.getProfileByIdCache(request, new Types.ObjectId(_headers.currentUserId), undefined, undefined);

    const headers: BaseHeaders = {
      ..._headers,
      clientKeyBase64,
    };
    const result = await this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.FetchLatest({
        queries,
        headers,
      }),
    );
    return result;
  }

  @Get('/tags/:tag/shorts')
  @Priority('critical')
  fetchByTag(@Param('tag') tag: string, @Headers(Const.UserID) currentUserId: string, @TransformedQuery(BaseQueries) queries: BaseQueries) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.FetchByTag({
        tag,
        currentUserId,
        queries,
      }),
    );
  }

  @Delete('/shorts/:id')
  @Priority('low')
  delete(@Param('id') id: string, @Headers(Const.UserID) currentUserId: string) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.Delete({
        id,
        currentUserId,
      }),
    );
  }

  @Patch('shorts/:id/tags/admin')
  @UseGuards(EditAccessGuard)
  @Priority('low')
  updateTagsAdmin(@Param('id') id: string, @Body() dto: UpdateTags) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.UpdateTags({
        update: dto,
        userId: undefined,
        id: id,
      }),
    );
  }

  @Get('shorts/all/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  getAll(@TransformedQuery(BaseQueries) queries: BaseQueries) {
    if (queries.skip === undefined) {
      throw new BadRequestException('skip query parameter is required');
    }
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.GetAll({
        queries: queries,
      }),
    );
  }

  @Delete('/shorts/:id/admin')
  @UseGuards(EditAccessGuard)
  @SkipFlowControl()
  deleteAdmin(@Param('id') id: string) {
    return this.grpc.runThisServiceOnce(
      this.grpc.shortVideo.Delete({
        id,
        currentUserId: undefined,
      }),
    );
  }

  getProfileByIdCache(request: FastifyRequest, id: Types.ObjectId, columns: string | undefined, exclude: string | undefined): void {
    try {
      this.cacheStore.handleCacheResultSilent(
        request,
        { cacheKey: ConstCacheKey.CACHE_KEY_USER_ID_HEADER_QUERY_CACHE_COLUMNS, key: `user:profile`, ttlMs: 60000 }, // 1 minute cache
        async () => {
          try {
            const data = {
              id: id.toHexString(),
              queries: {
                columns,
                exclude,
              },
              headers: {
                currentUserId: id.toHexString(),
              },
            };
            return await this.grpc.runThisServiceOnce(this.grpc.user.GetProfileById(data));
          } catch {
            return Promise.resolve(undefined);
          }
        },
      );
    } catch {
      /* empty */
      return;
    }
    return;
  }
}
