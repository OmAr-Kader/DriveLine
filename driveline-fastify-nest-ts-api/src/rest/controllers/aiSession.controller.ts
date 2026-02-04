import { Controller, Post, Get, Put, Delete, Body, Param, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateSession, CreateSessionAndAddFirstMessagePayload } from 'src/common/dto/aiSession.dto';
import { Priority } from 'src/rest/flow-control/decorators/priority.decorator';
import { Const } from 'src/common/utils/Const';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { GrpcClientService } from '../services/grpc-client.service';
import { TransformedHeader, TransformedQuery } from 'src/common/types/fastify-type';
import { BaseHeaders, BaseQueries } from 'src/common/dto/common.dto';

@Controller('ai-session')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class AiSessionController {
  constructor(private readonly grpc: GrpcClientService) {}

  @Post('sessions/with-first-message')
  @Priority('critical')
  async createSessionAndFirstMessage(@Body() body: CreateSessionAndAddFirstMessagePayload, @Headers(Const.UserID) userId: string) {
    const { title, text, isUser } = (body as { title: string; text: string; isUser: boolean }) ?? {}; // safe assignment
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiSession.CreateSessionAndAddFirstMessage({
        payload: { userId, title, text, isUser },
      }),
    );
  }

  @Post('sessions')
  async createSession(@Body() createSessionDto: CreateSession, @Headers(Const.UserID) userId: string) {
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiSession.CreateSession({
        payload: createSessionDto,
        userId,
      }),
    );
  }

  @Get('sessions')
  @Priority('critical')
  async listSessions(@TransformedQuery(BaseQueries) queries: BaseQueries, @TransformedHeader(BaseHeaders) headers: BaseHeaders) {
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiSession.ListSessions({
        queries,
        headers,
      }),
    );
  }

  @Put('sessions/:id')
  async updateSessionTitle(@Param('id') id: string, @Body() body: any, @Headers(Const.UserID) userId: string) {
    const title = (body as { title: string })?.title;
    if (typeof title !== 'string' || !title) {
      throw new BadRequestException('title is required');
    }
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiSession.UpdateSessionTitle({
        id,
        title,
        currentUserId: userId,
      }),
    );
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Headers(Const.UserID) userId: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiSession.DeleteSession({
        id,
        currentUserId: userId,
      }),
    );
  }
}
