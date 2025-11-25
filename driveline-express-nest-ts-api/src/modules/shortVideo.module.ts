import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortVideoController } from 'src/controllers/shortVideo.controller';
import { ShortVideoSchema, ShortVideo } from 'src/schema/shortVideo.schema';
import { ShortVideoService } from 'src/services/shortVideo.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ShortVideo.name, schema: ShortVideoSchema }])],
  providers: [ShortVideoService],
  controllers: [ShortVideoController],
  exports: [ShortVideoService],
})
export class ShortVideoModule {}
