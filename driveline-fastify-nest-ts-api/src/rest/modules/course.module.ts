import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CourseController } from '../controllers/course.controller';

@Module({
  providers: [JwtService],
  controllers: [CourseController],
})
export class CourseModule {}
