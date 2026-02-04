import { Module } from '@nestjs/common';
import { GeminiController } from '../controllers/gemini.controller';
import { HttpModule } from '@nestjs/axios';
import { Agent } from 'https';
import { AiMessageService } from '../services/aiMessage.service';
import { GeminiService } from '../services/geminiService';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // Fail request if no response within 10s
      maxRedirects: 3, // Follow up to 3 redirects
      httpsAgent: new Agent({
        keepAlive: true, // Reuse TCP connections for better performance
        keepAliveMsecs: 30000, // Keep idle sockets alive for 30s
        maxSockets: 50, // Max concurrent sockets per host
        maxFreeSockets: 10, // Keep up to 10 idle sockets ready
        scheduling: 'lifo', // Prefer recently used sockets (avoids stale ones)
      }),
    }),
  ],
  providers: [AiMessageService, GeminiService],
  controllers: [GeminiController],
  exports: [],
})
export class GeminiModule {}
