import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateShortVideoRequest,
  FetchAllRequest,
  FetchByTagRequest,
  FetchByTagResponse,
  FetchLatestRequest,
  FetchLatestResponse,
  GetByUserIdRequest,
  GetByUserIdResponse,
  IncrementViewsResponse,
  UpdateTagsRequest,
} from 'src/common/dto/shortVideo.dto';
import { Types } from 'mongoose';
import { Const_GRPC_ShortVideo, ConstGRPC } from 'src/common/utils/Const';
import { ShortVideo } from 'src/common/schema/shortVideo.schema';
import { ShortVideoService } from '../services/shortVideo.service';
import { IdRequest, IdUserIdRequest, IdUserIdUndefinedRequest, MessageResponse } from 'src/common/dto/common.dto';
import { ConsoleKit } from 'src/common/utils/LogKit';

@Controller()
export class ShortVideoController {
  constructor(private readonly service: ShortVideoService) {}

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.Create)
  create(data: CreateShortVideoRequest): Promise<IdRequest> {
    return this.service.create(data.video, new Types.ObjectId(data.userId));
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.UpdateTags)
  updateTags(data: UpdateTagsRequest): Promise<{ data: ShortVideo | undefined }> {
    return this.service.updateTags(new Types.ObjectId(data.id), data.update, new Types.ObjectId(data.userId));
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.IncrementViews)
  incrementViews(data: IdUserIdRequest): Promise<IncrementViewsResponse> {
    return this.service.incrementViews(new Types.ObjectId(data.id), data.currentUserId);
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.GetByUserId)
  GetByUserId(data: GetByUserIdRequest): Promise<GetByUserIdResponse> {
    return this.service.getByUserId(
      new Types.ObjectId(data.userId),
      data.userId,
      data.queries.limit,
      data.headers.cryptoMode,
      data.headers.clientKeyBase64,
    );
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.GetById)
  getById(data: { id: string; userId: string }): Promise<{ data: ShortVideo | undefined }> {
    return this.service.getById(new Types.ObjectId(data.id), data.userId);
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.FetchLatest)
  async fetchLatest(data: FetchLatestRequest): Promise<FetchLatestResponse> {
    ConsoleKit.logKit('Received GetByUserId gRPC request for', data);
    const result = await this.service.fetchLatest(
      new Types.ObjectId(data.headers.currentUserId),
      data.queries.limit,
      data.queries.skip,
      data.headers.cryptoMode,
      data.headers.clientKeyBase64,
    );
    return result;
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.FetchByTag)
  fetchByTag(data: FetchByTagRequest): Promise<FetchByTagResponse> {
    return this.service.fetchByTag(data.tag, data.currentUserId, data.queries.limit, data.queries.skip);
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.Delete)
  delete(data: IdUserIdUndefinedRequest): Promise<MessageResponse> {
    return this.service.delete(new Types.ObjectId(data.id), new Types.ObjectId(data.currentUserId));
  }

  @GrpcMethod(ConstGRPC.SHORT_VIDEO_SERVICE, Const_GRPC_ShortVideo.GetAll)
  getAll(data: FetchAllRequest): Promise<FetchLatestResponse> {
    return this.service.getAllVideos(data.queries.limit, data.queries.skip, data.queries.needTimestamp, data.queries.sort);
  }
}
