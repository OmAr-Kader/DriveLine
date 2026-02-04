import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AiMessageController } from '../controllers/aiMessage.controller';

@Module({
  providers: [JwtService],
  controllers: [AiMessageController],
})
export class AIMessageModule {}
