import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from 'src/grpc/services/user.service';
import { Types } from 'mongoose';
import {
  GetUserByIdRequest,
  GetProfileByIdRequest,
  UpdateUserRequest,
  GetAllUsersRequest,
  GetAllUsersResponse,
  GetProfileByIdResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from '../../common/dto/user.dto';
import { Const_GRPC_User, ConstGRPC } from 'src/common/utils/Const';
import { IdRequest, MessageResponse } from 'src/common/dto/common.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod(ConstGRPC.USER_SERVICE, Const_GRPC_User.FindAll)
  async findAll(data: GetAllUsersRequest): Promise<GetAllUsersResponse> {
    const a = await this.userService.findAll(data.search, data.queries.limit, data.queries.skip, data.queries.needTimestamp, data.queries.sort);
    return a;
  }

  @GrpcMethod(ConstGRPC.USER_SERVICE, Const_GRPC_User.GetProfileById)
  async getProfileById(data: GetProfileByIdRequest): Promise<GetProfileByIdResponse> {
    return await this.userService.getProfileById(
      new Types.ObjectId(data.id),
      data.headers.currentUserId,
      data.queries.columns,
      data.queries.exclude,
      data.headers.cryptoMode,
      data.headers.clientKeyBase64,
      data.queries.limit,
      data.queries.needTimestamp,
    );
  }

  @GrpcMethod(ConstGRPC.USER_SERVICE, Const_GRPC_User.FindById)
  async findById(data: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.userService.findById(new Types.ObjectId(data.id), data.currentUser ?? '', data.columns, data.exclude);
    return user;
  }

  @GrpcMethod(ConstGRPC.USER_SERVICE, Const_GRPC_User.Update)
  async update(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const user = await this.userService.update(new Types.ObjectId(data.id), data.data);
    return { user };
  }

  @GrpcMethod(ConstGRPC.USER_SERVICE, Const_GRPC_User.Delete)
  async remove(data: IdRequest): Promise<MessageResponse> {
    await this.userService.delete(new Types.ObjectId(data.id));
    return { message: 'User deleted' };
  }
}
