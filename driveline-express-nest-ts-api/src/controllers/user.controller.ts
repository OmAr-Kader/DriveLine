import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Patch,
  Headers,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserService } from '../services/user.service';
import { User } from 'src/schema/user.schema';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('users')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: any) {
    return await this.userService.create(data as Partial<User>);
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('columns') columns: string | undefined, @Query('exclude') exclude: string | undefined) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.userService.findById(new Types.ObjectId(id), columns, exclude);
  }

  @Get('profile/:id')
  async getProfileById(@Param('id') id: string, @Query('columns') columns: string | undefined, @Query('exclude') exclude: string | undefined) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('session id required');
    }
    return await this.userService.getProfileById(new Types.ObjectId(id), columns, exclude);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Headers('userId') userId: string) {
    if (!id || !Types.ObjectId.isValid(id) || !userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('session id required');
    }
    if (id !== userId) throw new ForbiddenException('User identity mismatch');

    return await this.userService.update(new Types.ObjectId(id), data as Partial<User>);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() data: any, @Headers('userId') userId: string) {
    if (!id || !Types.ObjectId.isValid(id) || !userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('session id required');
    }
    if (id !== userId) throw new ForbiddenException('User identity mismatch');

    return await this.userService.update(new Types.ObjectId(id), data as Partial<User>);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('userId') userId: string) {
    if (!id || !Types.ObjectId.isValid(id) || !userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('session id required');
    }
    if (id !== userId) throw new ForbiddenException('User identity mismatch');

    return await this.userService.delete(new Types.ObjectId(id));
  }
}
