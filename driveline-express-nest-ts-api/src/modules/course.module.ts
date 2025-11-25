import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from 'src/controllers/course.controller';
import { CourseSchema, Course } from 'src/schema/course.schema';
import { CoursesService } from 'src/services/course.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }])],
  providers: [CoursesService],
  controllers: [CourseController],
  exports: [CoursesService],
})
export class CourseModule {}
