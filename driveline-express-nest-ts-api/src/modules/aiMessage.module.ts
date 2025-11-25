import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiMessage, AiMessageSchema } from '../schema/aiMessage.schema';
import { AiMessageController } from '../controllers/aiMessage.controller';
import { AiMessageService } from 'src/services/aiMessage.service';
import { AiSession, AiSessionSchema } from 'src/schema/aiSession.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiMessage.name, schema: AiMessageSchema },
      { name: AiSession.name, schema: AiSessionSchema },
    ]),
  ],
  providers: [AiMessageService],
  controllers: [AiMessageController],
  exports: [AiMessageService],
})
export class AIMessageModule {}
