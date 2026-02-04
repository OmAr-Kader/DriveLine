import { Module } from '@nestjs/common';
import { ShortVideoController } from '../controllers/shortVideo.controller';
import { ShortVideoService } from '../services/shortVideo.service';

@Module({
  providers: [ShortVideoService],
  controllers: [ShortVideoController],
  exports: [ShortVideoService],
})
export class ShortVideoModule {}
