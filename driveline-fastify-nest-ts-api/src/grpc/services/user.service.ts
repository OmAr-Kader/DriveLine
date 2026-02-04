import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../common/schema/user.schema';
import { projectionFromRequest } from 'src/common/utils/projection';
import { Course, CourseDocument } from 'src/common/schema/course.schema';
import { ShortVideo, ShortVideoDocument } from 'src/common/schema/shortVideo.schema';
import { FixService, FixServiceDocument } from 'src/common/schema/fixService.schema';
import { CryptoMode } from 'src/common/utils/Const';
import { isUUID } from 'validator';
import { ECDHEncryptionService } from 'src/grpc/crypto/ecdh-encryption.service';
import { QueueService } from 'src/common/rabbitMQ/QueueService';
import { GetAllUsersResponse, GetProfileByIdResponse, GetUserByIdResponse } from 'src/common/dto/user.dto';
import { normalizeObject } from '../../common/types/mongoose-extensions';
import console from 'node:console';

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
    private readonly ecdhService: ECDHEncryptionService,
    private readonly queueService: QueueService,
  ) {}

  async findAll(search?: string, limit?: number, skip?: number, needTimestamp?: boolean, sort?: 'asc' | 'desc'): Promise<GetAllUsersResponse> {
    const escaped = search ? search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    const regex = new RegExp(escaped, 'i');
    const users = await this.userModel
      .find(
        search
          ? {
              $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
            }
          : {},
      )
      .select('-password')
      .limit(limit ?? 200)
      .skip(skip ?? 0)
      .sort({ createdAt: sort === 'desc' ? -1 : 1 })
      .execLeanObject<User[]>({ timeStamp: needTimestamp ?? true });
    return { users };
  }

  async findById(id: Types.ObjectId, currentUser: string, columns: string | undefined, exclude: string | undefined): Promise<GetUserByIdResponse> {
    const runtimeExcludes: string[] = ['password'];

    // Dynamic projection
    const userProjection = projectionFromRequest(columns, exclude, runtimeExcludes, { maxFields: 200 });

    const user = await this.userModel.findById(id).select(userProjection).execLeanObject<User>();
    if (!user) throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });

    this.queueService.trackActivity(currentUser, 'user_profile_viewed', 'user', id.toHexString(), { columns, exclude });

    return { user: user };
  }

  async update(id: Types.ObjectId, data: Partial<User>): Promise<User> {
    if (data.stripeGatewayId && !isUUID(data.stripeGatewayId)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Invalid stripeGatewayId' });
    }
    const normalizedData = normalizeObject(data);
    const allowedUpdates = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(normalizedData).filter(([key, value]) => !['_id', 'password', '__v', 'email'].includes(key)),
    );
    const user = await this.userModel
      .findByIdAndUpdate(id, allowedUpdates, {
        new: true,
        runValidators: true,
      })
      .select('-password')
      .execLeanObject<User>();
    if (!user) throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });

    this.queueService.trackActivity(id.toHexString(), 'user_updated', 'user', id.toHexString(), { updatedFields: Object.keys(allowedUpdates) });

    return user;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(id).lean().exec();
    if (!user) throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });

    this.queueService.trackActivity(id.toHexString(), 'user_deleted', 'user', id.toHexString(), { email: user.email });
  }

  async getProfileById(
    id: Types.ObjectId,
    currentUser: string,
    columns: string | undefined,
    exclude: string | undefined,
    cryptoMode?: string,
    clientKeyBase64?: string,
    limit?: number,
    needTimestamp?: boolean,
  ): Promise<GetProfileByIdResponse> {
    // Runtime exclude list
    const runtimeExcludes: string[] = ['password'];

    // Dynamic projection
    const userProjection = projectionFromRequest(columns, exclude, runtimeExcludes, { maxFields: 200 });

    const filter: object = { techId: id };
    const filterUser: object = { userId: id };
    console.log('Filters for profile retrieval:', needTimestamp);
    // =========================================================
    //  Run all 4 queries in parallel (FASTEST)
    // =========================================================
    const [user, services, courses, shorts] = await Promise.all([
      this.userModel.findById(id, userProjection).execLeanObject<User>({ timeStamp: needTimestamp ?? true }),
      this.serviceModel
        .find(filter)
        .select({ __v: 0 })
        .sort({ createdAt: -1 })
        .limit(limit ?? 100)
        .execLeanObject<FixService[]>({ timeStamp: needTimestamp ?? true }),
      this.courseModel
        .find(filter)
        .select({ __v: 0 })
        .sort({ createdAt: -1 })
        .limit(limit ?? 100)
        .execLeanObject<Course[]>({ timeStamp: needTimestamp ?? true }),
      this.shortVideoModel
        .find(filterUser)
        .select({ __v: 0 })
        .sort({ createdAt: -1 })
        .limit(limit ?? 100)
        .execLeanObject<ShortVideo[]>({ timeStamp: true }),
    ]);

    if (!user) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
    }

    this.queueService.trackActivity(currentUser, 'user_full_profile_viewed', 'user_profile', id.toHexString(), {
      servicesCount: services.length,
      coursesCount: courses.length,
      shortsCount: shorts.length,
      cryptoMode,
    });
    const data = {
      profile: {
        user: user,
        services: services,
        courses: courses,
        shorts: shorts,
      },
    };

    // NEED TO SPLIT LOGIC IF ONLY ENCRYPTING FOR RECEIVER
    if (cryptoMode === CryptoMode.DoubleCrypto || cryptoMode === CryptoMode.ReceiveOnly) {
      const encrypted = this.ecdhService.encryptObject(data, clientKeyBase64);
      return { encrypted };
    } else {
      return data;
    }
  }
}
