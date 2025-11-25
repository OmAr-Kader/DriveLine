import { Controller, Get, Post, Patch, Delete, Param, Headers, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateShortVideoDto, UpdateTagsDto } from 'src/dto/create.shortVideo.dto';
import { Types } from 'mongoose';
import { ShortVideoService } from 'src/services/shortVideo.service';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('video')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class ShortVideoController {
  constructor(private readonly service: ShortVideoService) {}

  @Post('shorts')
  create(@Body() dto: CreateShortVideoDto, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }

    return this.service.create(dto, new Types.ObjectId(userId));
  }

  @Patch('shorts/:id/tags')
  updateTags(@Param('id') id: string, @Body() dto: UpdateTagsDto, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }

    return this.service.updateTags(new Types.ObjectId(id), new Types.ObjectId(userId), dto);
  }

  @Post('shorts/:id/views/increment')
  incrementViews(@Param('id') id: string) {
    return this.service.incrementViews(new Types.ObjectId(id));
  }

  @Get('/user/:userId/shorts')
  getUserShorts(@Param('userId') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getByUserId(new Types.ObjectId(userId), Number(page), Number(limit));
  }

  @Get('/shorts/:id')
  getById(@Param('id') id: string) {
    return this.service.getById(new Types.ObjectId(id));
  }

  @Get('/latest/shorts')
  fetchLatest() {
    return this.service.fetchLatest();
  }

  @Get('/tags/:tag/shorts')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetchByTag(@Param('tag') tag: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.fetchByTag(tag); //Number(page), Number(limit)
  }

  @Delete('/shorts/:id')
  delete(@Param('id') id: string, @Headers('userId') userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId missing or invalid');
    }
    return this.service.delete(new Types.ObjectId(id), new Types.ObjectId(userId));
  }
}
