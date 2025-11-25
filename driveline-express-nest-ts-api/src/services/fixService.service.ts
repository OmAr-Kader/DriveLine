import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateFixServiceDto, UpdateFixServiceDto } from 'src/dto/create.FixService.dto';
import { FixService, FixServiceDocument } from 'src/schema/fixService.schema';

@Injectable()
export class FixServicesService {
  constructor(
    @InjectModel(FixService.name)
    private readonly serviceModel: Model<FixServiceDocument>,
  ) {}

  makePipeline(obj: PipelineStage): PipelineStage[] {
    return [
      obj,
      {
        $project: {
          __v: 0,
        },
      },
      // lookup tech (User) and only include required fields
      {
        $lookup: {
          from: 'users', // collection name of User model
          localField: 'techId',
          foreignField: '_id',
          as: 'tech',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                role: 1,
                age: 1,
                image: 1,
                location: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
      { $project: { __v: 0, techId: 0 } }, // remove unnecessary fields
    ];
  }

  async create(dto: CreateFixServiceDto) {
    const service = new this.serviceModel(dto);
    return service.save();
  }

  async update(id: Types.ObjectId, dto: UpdateFixServiceDto) {
    const updated = await this.serviceModel.findByIdAndUpdate(id, dto, { new: true }).lean().exec();

    if (!updated) throw new NotFoundException('Service not found');
    return updated;
  }

  async getServiceById(id: Types.ObjectId) {
    const pipeline = this.makePipeline({ $match: { _id: id } });

    const aggResult = await this.serviceModel.aggregate(pipeline).allowDiskUse(false).exec();

    if (!aggResult || aggResult.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return aggResult[0] as object;
  }

  async getServicesByServiceAdminId(serviceAdminId: number | string, isActive: boolean) {
    const match: object = { serviceAdminId, isActive };

    const pipeline = this.makePipeline({ $match: match });

    const result = await this.serviceModel.aggregate(pipeline).allowDiskUse(false).exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return { data: result };
  }

  async listByTech(techId: Types.ObjectId) {
    return await this.serviceModel.find({ techId }).sort({ createdAt: -1 }).lean().exec();
  }
}
