import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GenerateContentRequest, GenerateContentResponse } from 'src/common/dto/gemini.dto';
import { AiMessageService } from '../services/aiMessage.service';
import { Types } from 'mongoose';
import { ConsoleKit } from 'src/common/utils/LogKit';
import { GeminiService } from '../services/geminiService';
import { Const_GRPC_Gemini, ConstGRPC } from 'src/common/utils/Const';

@Controller()
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly aiMessageService: AiMessageService,
  ) {}

  @GrpcMethod(ConstGRPC.GEMINI_SERVICE, Const_GRPC_Gemini.GenerateContent)
  async generateContent(data: GenerateContentRequest): Promise<GenerateContentResponse> {
    const answerText = data.data.isTemp === true ? 'Temp Message' : await this.geminiService.generateContent(data.data.text);
    ConsoleKit.logKit('Received Gemini job:', data);
    try {
      const answerMessageSaved = await this.aiMessageService.createMessageFromServer(
        new Types.ObjectId(data.data.sessionId),
        data.data.text,
        answerText,
        data.data.saveQuestion === true,
      );
      ConsoleKit.logKit('Answer message saved:', answerMessageSaved);
      ConsoleKit.logKit('Channel ack for Response');
      return answerMessageSaved ? { message: answerMessageSaved } : { error: { text: answerText, error: 'Failed to save message' } };
    } catch (error) {
      const message = (error as Error | undefined)?.message ?? 'Unknown error';
      ConsoleKit.logKit('Answer message saved:', message);
      ConsoleKit.logKit('Channel ack for ERROR');
      return {
        error: { text: answerText, error: message },
      };
    }
  }
}
