import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiMessage, AiMessageSchema } from '../schema/aiMessage.schema';
import { AiMessageService } from 'src/services/aiMessage.service';
import { AiSession, AiSessionSchema } from 'src/schema/aiSession.schema';
import { GeminiService } from 'src/services/gemini.service';
import { GeminiController } from 'src/controllers/gemini.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: AiMessage.name, schema: AiMessageSchema },
      { name: AiSession.name, schema: AiSessionSchema },
    ]),
  ],
  providers: [GeminiService, AiMessageService],
  controllers: [GeminiController],
  exports: [GeminiService, AiMessageService],
})
export class GeminiModule {}
