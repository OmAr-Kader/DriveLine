import { Module } from '@nestjs/common';
import { AiSessionService } from 'src/grpc/services/aiSession.service';
import { AiSessionController } from '../controllers/aiSession.controller';

@Module({
  providers: [AiSessionService],
  controllers: [AiSessionController],
  exports: [AiSessionService],
})
export class AISessionModule {}
