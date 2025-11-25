import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateSessionDto } from 'src/dto/create.session.dto';
import { AiSessionService } from 'src/services/aiSession.service';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('ai-session')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class AiSessionController {
  constructor(private readonly aiSessionService: AiSessionService) {}

  @Post('sessions/with-first-message')
  async createSessionAndFirstMessage(@Body() body: any, @Req() req, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }
    const { title, text, isUser } = (body as { title: string; text: string; isUser: boolean }) ?? {}; // safe assignment
    if (typeof title !== 'string' || typeof text !== 'string' || typeof isUser !== 'boolean') {
      throw new BadRequestException('title, text, and isUser are required');
    }
    return await this.aiSessionService.createSessionAndAddFirstMessage(new Types.ObjectId(userId), title, text, isUser);
  }

  @Post('sessions')
  async createSession(@Body() createSessionDto: CreateSessionDto, @Req() req, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }
    const title = createSessionDto?.title;
    if (typeof title !== 'string' || !title) {
      throw new BadRequestException('title is required');
    }
    return await this.aiSessionService.createSession(new Types.ObjectId(userId), title);
  }

  @Get('sessions')
  async listSessions(@Query('limit') limit: string, @Query('skip') skip: string, @Req() req, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }
    const parsedLimit = Number(limit) || 50;
    const parsedSkip = Number(skip) || 0;
    return await this.aiSessionService.listSessions(new Types.ObjectId(userId), parsedLimit, parsedSkip);
  }

  @Put('sessions/:id')
  async updateSessionTitle(@Param('id') id: string, @Body() body: any) {
    const title = (body as { title: string })?.title;
    if (typeof title !== 'string' || !title) {
      throw new BadRequestException('title is required');
    }
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.aiSessionService.updateSessionTitle(new Types.ObjectId(id), title);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    await this.aiSessionService.deleteSession(new Types.ObjectId(id));
    return { success: true };
  }
}
