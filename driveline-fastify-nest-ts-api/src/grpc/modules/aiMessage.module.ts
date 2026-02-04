import { Module } from '@nestjs/common';
import { AiMessageService } from 'src/grpc/services/aiMessage.service';
import { AiMessageController } from '../controllers/aiMessage.controller';

@Module({
  providers: [AiMessageService],
  controllers: [AiMessageController],
  exports: [AiMessageService],
})
export class AIMessageModule {}
