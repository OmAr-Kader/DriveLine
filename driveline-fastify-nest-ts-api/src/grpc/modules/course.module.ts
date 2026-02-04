import { Module } from '@nestjs/common';
import { CoursesService } from 'src/grpc/services/course.service';
import { CourseController } from '../controllers/course.controller';

@Module({
  providers: [CoursesService],
  controllers: [CourseController],
  exports: [CoursesService],
})
export class CourseModule {}
