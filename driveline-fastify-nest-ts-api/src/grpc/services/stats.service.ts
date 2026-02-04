import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/common/schema/user.schema';
import { FixService, FixServiceDocument } from 'src/common/schema/fixService.schema';
import { Course, CourseDocument } from 'src/common/schema/course.schema';
import { ShortVideo, ShortVideoDocument } from 'src/common/schema/shortVideo.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(FixService.name) private readonly fixServiceModel: Model<FixServiceDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(ShortVideo.name) private readonly shortVideoModel: Model<ShortVideoDocument>,
  ) {}

  async countUsers(): Promise<number> {
    return this.userModel.countDocuments({}).lean().exec();
  }

  async countFixServices(): Promise<number> {
    return this.fixServiceModel.countDocuments({}).lean().exec();
  }

  async countCourses(): Promise<number> {
    return this.courseModel.countDocuments({}).lean().exec();
  }

  async countShortVideos(): Promise<number> {
    return this.shortVideoModel.countDocuments({}).lean().exec();
  }

  async getAllCounts(): Promise<{ users: number; fixServices: number; courses: number; shortVideos: number }> {
    const [users, fixServices, courses, shortVideos] = await Promise.all([
      this.countUsers(),
      this.countFixServices(),
      this.countCourses(),
      this.countShortVideos(),
    ]);

    return { users, fixServices, courses, shortVideos };
  }
}
