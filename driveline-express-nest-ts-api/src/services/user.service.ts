import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { projectionFromRequest } from 'src/utils/projection';
import { Course, CourseDocument } from 'src/schema/course.schema';
import { ShortVideo, ShortVideoDocument } from 'src/schema/shortVideo.schema';
import { FixService, FixServiceDocument } from 'src/schema/fixService.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ShortVideo.name)
    private readonly shortVideoModel: Model<ShortVideoDocument>,
    @InjectModel(FixService.name)
    private readonly serviceModel: Model<FixServiceDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: Types.ObjectId, columns: string | undefined, exclude: string | undefined): Promise<User> {
    const runtimeExcludes: string[] = ['password'];

    // Dynamic projection
    const userProjection = projectionFromRequest(columns, exclude, runtimeExcludes, { maxFields: 200 });

    const user = await this.userModel.findById(id).select(userProjection).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: Types.ObjectId, data: Partial<User>): Promise<User> {
    const allowedUpdates = Object.fromEntries(Object.entries(data).filter(([key]) => !['_id', 'password', '__v', 'email'].includes(key)));
    const user = await this.userModel
      .findByIdAndUpdate(id, allowedUpdates, {
        new: true,
        runValidators: true,
      })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
  }

  async getProfileById(id: Types.ObjectId, columns: string | undefined, exclude: string | undefined): Promise<object> {
    // Runtime exclude list
    const runtimeExcludes: string[] = ['password'];

    // Dynamic projection
    const userProjection = projectionFromRequest(columns, exclude, runtimeExcludes, { maxFields: 200 });

    const filter: object = { techId: id };
    const filterUser: object = { userId: id };

    // =========================================================
    //  Run all 4 queries in parallel (FASTEST)
    // =========================================================

    const [user, services, courses, shorts] = await Promise.all([
      this.userModel.findById(id, userProjection).lean().exec(),
      this.serviceModel.find(filter).select({ __v: 0 }).sort({ createdAt: -1 }).lean().exec(),
      this.courseModel.find(filter).select({ __v: 0 }).sort({ createdAt: -1 }).lean().exec(),
      this.shortVideoModel.find(filterUser).select({ __v: 0 }).sort({ createdAt: -1 }).lean().exec(),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
      services,
      courses,
      shorts,
    };
  }
}
