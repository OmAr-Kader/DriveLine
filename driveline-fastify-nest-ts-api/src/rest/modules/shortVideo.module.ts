import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShortVideoController } from '../controllers/shortVideo.controller';

@Module({
  providers: [JwtService],
  controllers: [ShortVideoController],
})
export class ShortVideoModule {}
