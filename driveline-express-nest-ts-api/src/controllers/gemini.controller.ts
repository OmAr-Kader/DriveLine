import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { GeminiService } from '../services/gemini.service';
import { CreateGeminiDto, GeminiError } from 'src/dto/create.gemini.dto';
import { AiMessageService } from '../services/aiMessage.service';
import { AiMessage } from 'src/schema/aiMessage.schema';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';
// import a message service here if needed, not from controller

@Controller('service')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly messageService: AiMessageService,
  ) {}

  @Post('gemini')
  async generate(@Body() body: CreateGeminiDto) {
    const { sessionId, text, saveQuestion } = body;
    if (!text || typeof text !== 'string') {
      throw new BadRequestException('text is required');
    }
    try {
      const answerText = await this.geminiService.generateContent(text);
      let answerMessageSaved: AiMessage | undefined = undefined;
      if (sessionId && Types.ObjectId.isValid(sessionId)) {
        answerMessageSaved = await this.messageService.createMessageFromServer(
          new Types.ObjectId(sessionId),
          text,
          answerText,
          saveQuestion === true,
        );
      }
      if (answerMessageSaved) {
        return answerMessageSaved;
      } else {
        return {
          text: answerText,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (err: unknown) {
      // Instead of err: any, use err: unknown. Then use type guards:
      if (typeof err === 'object' && err !== null && 'response' in err) {
        // Could use AxiosError type if desired
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { error?: { message?: string } };
          };
        };
        throw new GeminiError('ApiError', axiosErr.response?.status, axiosErr.response?.data?.error?.message || 'Unknown API error');
      } else if (err instanceof Error) {
        throw new GeminiError('NetworkError', undefined, err.message);
      } else {
        throw new GeminiError('NetworkError', undefined, 'Unknown error');
      }
    }
  }
}
