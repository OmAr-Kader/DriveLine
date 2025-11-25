import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateCourseDto, UpdateCourseDto } from 'src/dto/create.course.dto';
import { CoursesService } from 'src/services/course.service';
import { ApiKeyGuard } from 'src/utils/verification';
import { JwtAuthGuard } from 'src/utils/verifyJWTtoken';

@Controller('school')
@UseGuards(JwtAuthGuard, ApiKeyGuard)
export class CourseController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('courses')
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch('courses/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return this.coursesService.update(new Types.ObjectId(id), dto);
  }

  @Get('courses/:id')
  getOne(@Param('id') id: string) {
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return this.coursesService.getCourseById(new Types.ObjectId(id));
  }

  @Get('courses')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  list(@Query('courseAdminId') courseAdminId: number, @Query('isActive') isActive: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    if (!courseAdminId || !isActive) throw new BadRequestException('Invalid data');
    return this.coursesService.getCoursesByCourseAdminId(Number(courseAdminId), isActive === 'true');
  }

  @Get('tech/:techId/courses')
  getTechServices(@Param('techId') techId: string) {
    if (!techId || !Types.ObjectId.isValid(techId)) throw new BadRequestException('Invalid id');
    return this.coursesService.listByTech(new Types.ObjectId(techId));
  }
}
