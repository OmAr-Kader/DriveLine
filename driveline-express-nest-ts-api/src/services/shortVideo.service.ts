import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateShortVideoDto } from 'src/dto/create.shortVideo.dto';
import { UpdateTagsDto } from 'src/dto/create.shortVideo.dto';
import { ShortVideo, ShortVideoDocument } from 'src/schema/shortVideo.schema';

@Injectable()
export class ShortVideoService {
  constructor(
    @InjectModel(ShortVideo.name)
    private readonly shortVideoModel: Model<ShortVideoDocument>,
  ) {}

  async create(dto: CreateShortVideoDto, userId: Types.ObjectId) {
    const tags = Array.isArray(dto.tags) ? Array.from(new Set(dto.tags.map(Number).filter(Number.isFinite))) : [];

    const created = await this.shortVideoModel.create({
      userId,
      title: dto.title,
      link: dto.link,
      thumbImageName: dto.thumbImageName,
      tags,
    });

    return created;
  }

  async getByUserId(userId: Types.ObjectId, page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const skip = (page - 1) * limit;

    const items = await this.shortVideoModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();

    return { data: items };
  }

  async getById(id: Types.ObjectId) {
    const item = await this.shortVideoModel.findById(id).lean().exec();
    if (!item) throw new NotFoundException('Short video not found');

    return item;
  }

  async fetchByTag(tag: string | number) {
    const maybeNumber = Number(tag);
    const normalizedTag = Number.isFinite(maybeNumber) ? maybeNumber : tag;

    //page = Math.max(1, page);
    //limit = Math.min(100, Math.max(1, limit));
    //const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { tags: normalizedTag } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                role: 1,
                image: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { __v: 0, techId: 0 } },
    ];

    const aggResult = await this.shortVideoModel.aggregate(pipeline).allowDiskUse(false).exec();
    if (!aggResult.length) throw new NotFoundException('Service not found');

    return { data: aggResult };
  }

  async fetchLatest() {
    const pipeline: PipelineStage[] = [
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                role: 1,
                image: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { __v: 0, userId: 0 } },
    ];

    const aggResult = await this.shortVideoModel.aggregate(pipeline).allowDiskUse(false).exec();
    if (!aggResult.length) throw new NotFoundException('Service not found');

    return { data: aggResult };
  }

  async incrementViews(id: Types.ObjectId) {
    const updated = await this.shortVideoModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true, select: 'views' })
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Short video not found');

    return { views: updated.views };
  }

  async updateTags(id: Types.ObjectId, userId: Types.ObjectId, dto: UpdateTagsDto) {
    const normalizedTags = Array.from(new Set(dto.tags.map(Number).filter(Number.isFinite)));

    const updated = await this.shortVideoModel
      .findOneAndUpdate(
        { _id: id, userId }, // enforce ownership
        { $set: { tags: normalizedTags } },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Short video not found or You do not own this video');

    return updated;
  }

  async delete(id: Types.ObjectId, userId: Types.ObjectId) {
    const removed = await this.shortVideoModel.findOneAndDelete({ _id: id, userId }).exec();

    if (!removed) throw new NotFoundException('Short video not found or You do not own this video');

    return { message: 'Deleted successfully' };
  }
}
