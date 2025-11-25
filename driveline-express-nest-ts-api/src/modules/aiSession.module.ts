import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiSession, AiSessionSchema } from '../schema/aiSession.schema';
import { AiSessionController } from '../controllers/aiSession.controller';
import { AiSessionService } from 'src/services/aiSession.service';
import { AiMessage, AiMessageSchema } from 'src/schema/aiMessage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiMessage.name, schema: AiMessageSchema },
      { name: AiSession.name, schema: AiSessionSchema },
    ]),
  ],
  providers: [AiSessionService],
  controllers: [AiSessionController],
  exports: [AiSessionService],
})
export class AISessionModule {}
