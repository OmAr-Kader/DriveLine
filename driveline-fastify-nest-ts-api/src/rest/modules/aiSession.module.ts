import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AiSessionController } from '../controllers/aiSession.controller';

@Module({
  providers: [JwtService],
  controllers: [AiSessionController],
})
export class AISessionModule {}
