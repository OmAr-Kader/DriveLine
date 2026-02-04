import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Types } from 'mongoose';
import {
  CreateCourseRequest,
  GetAllCoursesRequest,
  GetCoursesByCourseAdminIdRequest,
  ListByTechRequest,
  UpdateCourse,
} from 'src/common/dto/course.dto';
import { CoursesService } from 'src/grpc/services/course.service';
import { Const_GRPC_Course, ConstGRPC } from 'src/common/utils/Const';
import { Course } from 'src/common/schema/course.schema';

@Controller('school')
export class CourseController {
  constructor(private readonly coursesService: CoursesService) {}

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.Create)
  Create(data: CreateCourseRequest): Promise<{ course: Course }> {
    return this.coursesService.create(data.course, data.currentUser);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.Update)
  Update(data: { id: string; update: UpdateCourse; currentUser: string }): Promise<{ course: Course }> {
    return this.coursesService.update(new Types.ObjectId(data.id), data.update, data.currentUser);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.GetCourseById)
  GetCourseById(data: { id: string; currentUser: string }): Promise<{ course: object }> {
    return this.coursesService.getCourseById(new Types.ObjectId(data.id), data.currentUser);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.GetCoursesByCourseAdminId)
  GetCoursesByCourseAdminId(data: GetCoursesByCourseAdminIdRequest): Promise<{ data: object[] }> {
    return this.coursesService.getCoursesByCourseAdminId(data.courseAdminId, data.isActive, data.currentUser, data.queries.limit, data.queries.skip);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.ListByTech)
  ListByTech(data: ListByTechRequest): Promise<{ data: Course[] }> {
    return this.coursesService.listByTech(new Types.ObjectId(data.techId), data.currentUser, data.queries.limit, data.queries.skip);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.GetAllCourses)
  GetAllCourses(data: GetAllCoursesRequest): Promise<{ data: Course[] }> {
    return this.coursesService.getAllCourses(data.queries.limit, data.queries.skip, data.queries.needTimestamp, data.queries.sort);
  }

  @GrpcMethod(ConstGRPC.COURSE_SERVICE, Const_GRPC_Course.Delete)
  async Delete(data: { id: string }): Promise<{ message: string }> {
    return await this.coursesService.delete(new Types.ObjectId(data.id));
  }
}
