import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { AnyExpression, Model, PipelineStage, Types } from 'mongoose';
import { CreateShortVideo, FetchByTagResponse, FetchLatestResponse, GetByUserIdResponse, UpdateTags } from 'src/common/dto/shortVideo.dto';
import { ShortVideo, ShortVideoDocument } from 'src/common/schema/shortVideo.schema';
import { CryptoMode } from 'src/common/utils/Const';
import { ECDHEncryptionService } from 'src/grpc/crypto/ecdh-encryption.service';
import { QueueService } from 'src/common/rabbitMQ/QueueService';

@Injectable()
export class ShortVideoService {
  constructor(
    @InjectModel(ShortVideo.name)
    private readonly shortVideoModel: Model<ShortVideoDocument>,
    private readonly ecdhService: ECDHEncryptionService,
    private readonly queueService: QueueService,
  ) {}

  private getInitialStages(obj: PipelineStage[]): PipelineStage[] {
    return [...obj];
  }

  private getPaginationStages(options?: { limit?: number; skip?: number }): PipelineStage[] {
    const stages: PipelineStage[] = [];
    if (options?.limit !== undefined) {
      if (options?.skip !== undefined) {
        stages.push({ $skip: options.skip });
      }
      stages.push({ $limit: options.limit });
    }
    return stages;
  }

  private getLookupStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { name: 1, role: 1, email: 1, phone: 1, image: 1 } },
            { $addFields: { id: { $toString: '$_id' } } },
            { $project: { _id: 0 } },
          ],
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ];
  }

  private getTransformStages(options?: { timestamp?: boolean }): PipelineStage[] {
    const addFieldsStage: Record<string, AnyExpression> = {
      id: { $toString: '$_id' },
    };

    if (options?.timestamp === true) {
      addFieldsStage.createdAt = { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } };
      addFieldsStage.updatedAt = { $dateToString: { date: '$updatedAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } };
    }

    return [{ $addFields: addFieldsStage }, { $project: { __v: 0, userId: 0, _id: 0 } }];
  }

  private async executeAggregationStages(stages: PipelineStage[]): Promise<object[]> {
    return this.shortVideoModel.aggregate(stages).exec() as Promise<object[]>;
  }

  async create(dto: CreateShortVideo, userId: Types.ObjectId): Promise<{ id: string }> {
    const tags = Array.isArray(dto.tags) ? Array.from(new Set(dto.tags.map(Number).filter(Number.isFinite))) : [];

    const created = await this.shortVideoModel.create({
      userId,
      title: dto.title,
      link: dto.link,
      thumbImageName: dto.thumbImageName,
      tags,
    });

    this.queueService.trackActivity(userId.toHexString(), 'short_video_created', 'short_video', created.id, {
      title: dto.title,
      tags,
    });

    return { id: created.id };
  }

  async getByUserId(
    userId: Types.ObjectId,
    currentUserId: string,
    limit?: number,
    cryptoMode?: string,
    clientKeyBase64?: string,
  ): Promise<GetByUserIdResponse> {
    const items = await this.shortVideoModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit || 100)
      .execLeanObject<ShortVideo[]>();
    this.queueService.trackActivity(currentUserId, 'short_videos_listed_by_user', 'short_video', 'list', {
      userId: userId.toHexString(),
      count: items.length,
      cryptoMode,
    });
    const result = { data: { videos: items as object[] } };
    if (cryptoMode == CryptoMode.DoubleCrypto || cryptoMode == CryptoMode.ReceiveOnly) {
      const encrypt = this.ecdhService.encryptObject(result, clientKeyBase64);
      return { encrypted: encrypt };
    }
    return result;
  }

  async getById(id: Types.ObjectId, currentUserId: string): Promise<{ data: ShortVideo | undefined }> {
    const item = await this.shortVideoModel.findById(id).execLeanObject<ShortVideo>();
    if (!item) throw new RpcException({ code: status.NOT_FOUND, message: 'Short video not found' });
    const data = item;

    this.queueService.trackActivity(currentUserId, 'short_video_viewed', 'short_video', id.toHexString(), { videoId: data.id });

    return { data };
  }

  async fetchByTag(tag: string | number, currentUserId: string, limit?: number, skip?: number): Promise<FetchByTagResponse> {
    const maybeNumber = Number(tag);
    const normalizedTag = Number.isFinite(maybeNumber) ? maybeNumber : tag;

    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages([{ $match: { tags: normalizedTag } }, { $sort: { createdAt: -1 } }]));
    pipeline.push(...this.getPaginationStages({ limit: limit || 100, skip: skip || 0 }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages());

    const aggResult = await this.executeAggregationStages(pipeline);
    if (!aggResult.length) throw new RpcException({ code: status.NOT_FOUND, message: 'No Videos in this tag' });

    this.queueService.trackActivity(currentUserId, 'short_videos_listed_by_tag', 'short_video', 'list', {
      tag: normalizedTag,
      count: aggResult.length,
    });

    return { data: { videos: aggResult } };
  }

  async fetchLatest(
    userId: Types.ObjectId,
    limit?: number,
    skip?: number,
    cryptoMode?: string,
    clientKeyBase64?: string,
  ): Promise<FetchLatestResponse> {
    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages([{ $sort: { createdAt: -1 } }]));
    pipeline.push(...this.getPaginationStages({ limit: limit || 50, skip }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages({ timestamp: true }));

    const aggResult: object[] = await this.executeAggregationStages(pipeline);
    if (!aggResult.length) throw new RpcException({ code: status.NOT_FOUND, message: 'No Videos found' });

    const result = { data: { videos: aggResult } };
    this.queueService.trackActivity(userId.toHexString(), 'short_videos_latest_fetched', 'short_video', 'list', {
      count: aggResult.length,
      cryptoMode,
    });
    // NEED TO SPLIT LOGIC IF ONLY ENCRYPTING FOR RECEIVER
    if (cryptoMode == CryptoMode.DoubleCrypto || cryptoMode == CryptoMode.ReceiveOnly) {
      const encrypted = this.ecdhService.encryptObject(result, clientKeyBase64);
      return { encrypted: encrypted };
    }

    return result;
  }

  async incrementViews(id: Types.ObjectId, currentUserId: string): Promise<{ views: number }> {
    const updated = await this.shortVideoModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true, select: 'views' })
      .execLeanObject<ShortVideo>();

    if (!updated) throw new RpcException({ code: status.NOT_FOUND, message: 'Short video not found' });

    this.queueService.trackActivity(currentUserId, 'short_video_view_incremented', 'short_video', id.toHexString(), { views: updated.views });

    return { views: updated.views };
  }

  async updateTags(_id: Types.ObjectId, dto: UpdateTags, userId?: Types.ObjectId): Promise<{ data: ShortVideo | undefined }> {
    const normalizedTags = Array.from(new Set(dto.tags.map(Number).filter(Number.isFinite)));

    const updated = await this.shortVideoModel
      .findOneAndUpdate(
        userId ? { _id, userId } : { _id }, // enforce ownership
        { $set: { tags: normalizedTags } },
        { new: true },
      )
      .execLeanObject<ShortVideo>();

    if (!updated) throw new RpcException({ code: status.NOT_FOUND, message: 'Short video not found or You do not own this video' });

    if (userId) {
      this.queueService.trackActivity(userId.toHexString(), 'short_video_tags_updated', 'short_video', _id.toHexString(), { tags: normalizedTags });
    }

    return { data: updated };
  }

  async delete(_id: Types.ObjectId, userId?: Types.ObjectId): Promise<{ message: string }> {
    const removed = await this.shortVideoModel
      .findOneAndDelete(userId ? { _id, userId } : { _id })
      .lean()
      .exec();

    if (!removed) throw new RpcException({ code: status.NOT_FOUND, message: 'Short video not found or You do not own this video' });
    if (userId) {
      this.queueService.trackActivity(userId.toHexString(), 'short_video_deleted', 'short_video', _id.toHexString());
    }

    return { message: 'Deleted successfully' };
  }

  async getAllVideos(limit?: number, skip?: number, needTimestamp?: boolean, sort?: 'asc' | 'desc'): Promise<FetchLatestResponse> {
    const items = await this.shortVideoModel
      .find()
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .limit(limit ?? 200)
      .skip(skip ?? 0)
      .execLeanObject<ShortVideo[]>({ timeStamp: needTimestamp ?? true });
    return { data: { videos: items as object[] } };
  }
}
