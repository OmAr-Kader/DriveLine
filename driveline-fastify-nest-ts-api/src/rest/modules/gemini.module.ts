import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeminiController } from 'src/rest/controllers/gemini.controller';

@Module({
  providers: [JwtService],
  controllers: [GeminiController],
  exports: [],
})
export class GeminiModule {}
