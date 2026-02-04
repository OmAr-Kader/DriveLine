import { Controller, Post, Get, Put, Delete, Body, Headers, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateAIMessage } from 'src/common/dto/aiMessage.dto';
import { Priority } from 'src/rest/flow-control/decorators/priority.decorator';
import { Const } from 'src/common/utils/Const';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { GrpcClientService } from '../services/grpc-client.service';
import { BaseQueries, BaseHeaders } from 'src/common/dto/common.dto';
import { TransformedQuery, TransformedHeader } from 'src/common/types/fastify-type';

@Controller('ai-message')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class AiMessageController {
  constructor(private readonly grpc: GrpcClientService) {}

  @Post('messages')
  async createMessage(@Body() createMessageDto: CreateAIMessage, @Headers(Const.UserID) userId: string): Promise<{ message: any }> {
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiMessage.CreateMessage({
        payload: createMessageDto,
        currentUserId: userId,
      }),
    );
  }

  @Get('messages/:id')
  async getMessage(@Param('id') id: string, @Headers(Const.UserID) userId: string): Promise<{ message: any }> {
    if (id == null || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid message id');
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiMessage.GetMessage({
        id,
        currentUserId: userId,
      }),
    );
  }

  @Put('messages/:id')
  async updateMessage(@Param('id') id: string, @Body() body: any, @Headers(Const.UserID) userId: string): Promise<{ message: any }> {
    const bdy = body as {
      text: string;
      isUser: boolean;
    };
    const text = bdy?.text as string | undefined;
    const isUser = bdy?.isUser as boolean | undefined;
    if (isUser == null || text == null) {
      throw new BadRequestException('text and isUser are required');
    }
    if (typeof text !== 'string' && typeof isUser !== 'boolean') {
      throw new BadRequestException('text or isUser required for update');
    }
    if (id == null || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('message id required');
    }
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiMessage.UpdateMessage({
        id,
        currentUserId: userId,
        text,
        isUser,
      }),
    );
  }

  @Get('sessions/:sessionId/messages')
  @Priority('high')
  async getMessagesBySession(
    @Param('sessionId') sessionId: string | undefined,
    @TransformedQuery(BaseQueries) queries: BaseQueries,
    @TransformedHeader(BaseHeaders) headers: BaseHeaders,
  ): Promise<{ messages: any[] }> {
    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestException('Invalid sessionId');
    }
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiMessage.GetMessagesBySession({
        sessionId,
        queries: queries,
        headers: headers,
      }),
    );
  }

  @Delete('messages/:id')
  @Priority('medium')
  async deleteMessage(@Param('id') id: string, @Headers(Const.UserID) userId: string): Promise<{ message: string }> {
    if (id == null || typeof id !== 'string') {
      throw new BadRequestException('message id required');
    }
    const ids = id
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    if (!ids.length) {
      throw new BadRequestException('No valid ids');
    }
    ids.forEach((i) => {
      if (!Types.ObjectId.isValid(i)) {
        throw new BadRequestException(`Invalid id: ${i}`);
      }
    });
    return await this.grpc.runThisServiceOnce(
      this.grpc.aiMessage.DeleteMessage({
        ids,
        currentUserId: userId,
      }),
    );
  }
}
