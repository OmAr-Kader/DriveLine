import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateMessageDto } from 'src/dto/create.message.dto';
import { AiMessageService } from 'src/services/aiMessage.service';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('ai-message')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class AiMessageController {
  constructor(private readonly aiMessageService: AiMessageService) {}

  @Post('messages')
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    const { sessionId, text, isUser } = createMessageDto ?? {};
    if (!sessionId || !Types.ObjectId.isValid(sessionId) || typeof isUser !== 'boolean') {
      throw new BadRequestException('sessionId, text, isUser are required');
    }
    return await this.aiMessageService.createMessage(new Types.ObjectId(sessionId), text, isUser);
  }

  @Get('messages/:id')
  async getMessage(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid message id');
    return await this.aiMessageService.getMessage(new Types.ObjectId(id));
  }

  @Put('messages/:id')
  async updateMessage(@Param('id') id: string, @Body() body: any) {
    const bdy = body as {
      text: string;
      isUser: boolean;
    };
    const text = bdy?.text as string | undefined;
    const isUser = bdy?.isUser as boolean | undefined;
    if (!isUser || !text) {
      throw new BadRequestException('text and isUser are required');
    }
    if (typeof text !== 'string' && typeof isUser !== 'boolean') {
      throw new BadRequestException('text or isUser required for update');
    }
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('message id required');
    }
    return await this.aiMessageService.updateMessage(new Types.ObjectId(id), text, isUser);
  }

  @Get('sessions/:sessionId/messages')
  async getMessagesBySession(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sort') sort: 'asc' | 'desc' = 'desc',
  ) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestException('Invalid sessionId');
    }
    const parsedLimit = Number(limit) || 100;
    return await this.aiMessageService.getMessagesBySession(new Types.ObjectId(sessionId), parsedLimit, sort);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    if (!id || typeof id !== 'string') {
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
    const objectIds = ids.map((i) => new Types.ObjectId(i));
    await this.aiMessageService.deleteMessage(objectIds);
    return { success: true };
  }
}
