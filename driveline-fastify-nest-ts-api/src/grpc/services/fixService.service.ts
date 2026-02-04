import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateFixService, UpdateFixService } from 'src/common/dto/fixService.dto';
import { FixService, FixServiceDocument } from 'src/common/schema/fixService.schema';
import { QueueService } from 'src/common/rabbitMQ/QueueService';
import { normalizeObject } from 'src/common/types/mongoose-extensions';

@Injectable()
export class FixServicesService {
  constructor(
    @InjectModel(FixService.name)
    private readonly serviceModel: Model<FixServiceDocument>,
    private readonly queueService: QueueService,
  ) {}

  private getInitialStages(obj: PipelineStage | PipelineStage[]): PipelineStage[] {
    const stages = Array.isArray(obj) ? obj : [obj];
    return [
      ...stages,
      {
        $project: {
          __v: 0,
        },
      },
    ];
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
          localField: 'techId',
          foreignField: '_id',
          as: 'tech',
          pipeline: [
            {
              $addFields: {
                id: { $toString: '$_id' },
              },
            },
            {
              $project: {
                id: 1,
                name: 1,
                email: 1,
                phone: 1,
                role: 1,
                age: 1,
                image: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
    ];
  }

  private getTransformStages(options?: { timestamp?: boolean }): PipelineStage[] {
    const timestamp = options?.timestamp === true;
    return [
      {
        $addFields: timestamp
          ? {
              id: { $toString: '$_id' },
              createdAt: { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
              updatedAt: { $dateToString: { date: '$updatedAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
              tech: {
                $cond: [
                  { $ifNull: ['$tech', false] },
                  {
                    $mergeObjects: ['$tech', { id: { $toString: '$tech._id' } }],
                  },
                  '$$REMOVE',
                ],
              },
            }
          : {
              id: { $toString: '$_id' },
              tech: {
                $cond: [
                  { $ifNull: ['$tech', false] },
                  {
                    $mergeObjects: ['$tech', { id: { $toString: '$tech._id' } }],
                  },
                  '$$REMOVE',
                ],
              },
            },
      },
      {
        $project: timestamp ? { __v: 0, techId: 0, _id: 0 } : { __v: 0, techId: 0, _id: 0, createdAt: 0, updatedAt: 0 },
      },
    ];
  }

  private async executeAggregationStages(stages: PipelineStage[]): Promise<object[]> {
    return this.serviceModel.aggregate(stages).exec() as Promise<object[]>;
  }

  async create(dto: CreateFixService, userId: string): Promise<{ service: FixService }> {
    const _service = await this.serviceModel.create(dto);
    const service: FixService = _service.toObject();
    this.queueService.trackActivity(userId, 'service_created', 'service', service.id, { price: dto.price, isActive: dto.isActive });

    return { service };
  }

  async update(id: Types.ObjectId, dto: UpdateFixService, userId: string): Promise<{ service: FixService }> {
    const toUpdate = normalizeObject(dto);

    const service = await this.serviceModel.findByIdAndUpdate(id, toUpdate, { new: true }).execLeanObject<FixService>();

    if (!service) throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
    this.queueService.trackActivity(userId, 'service_updated', 'service', id.toHexString(), { updatedFields: Object.keys(dto) });

    return { service };
  }

  async getServiceById(id: Types.ObjectId, userId: string): Promise<{ service: object }> {
    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages({ $match: { _id: id } }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages());

    const aggResult = await this.executeAggregationStages(pipeline);

    if (!aggResult || aggResult.length === 0) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
    }

    const service = aggResult[0];

    this.queueService.trackActivity(userId, 'service_viewed', 'service', id.toHexString(), { serviceId: id });

    return { service };
  }

  /**
   * @deprecated
   */
  async getServiceByIdOld(id: Types.ObjectId) {
    const service = await this.serviceModel
      .findById(id)
      .sort({ createdAt: -1 })
      .populate('techId') // _id name email image
      .execLeanObject<FixService>();
    if (!service) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
    }
    return { service };
  }

  async getServicesByServiceAdminId(
    serviceAdminId: number | string,
    isActive: boolean,
    userId: string,
    limit?: number,
    skip?: number,
  ): Promise<{ data: object[] }> {
    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages([{ $match: { serviceAdminId, isActive } }, { $sort: { createdAt: -1 } }]));
    pipeline.push(...this.getPaginationStages({ limit: limit || 30, skip: skip || 0 }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages({ timestamp: true }));

    const res = await this.executeAggregationStages(pipeline);

    if (!res) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
    }
    const result = { data: res };

    this.queueService.trackActivity(userId, 'services_listed', 'service', 'list', { serviceAdminId, count: res.length, isActive });

    return result;
  }

  async listByTech(techId: Types.ObjectId, userId: string, limit?: number, skip?: number): Promise<{ data: FixService[] }> {
    const data = await this.serviceModel
      .find({ techId })
      .sort({ createdAt: -1 })
      .limit(limit || 30)
      .skip(skip || 0)
      .execLeanObject<FixService[]>();
    this.queueService.trackActivity(userId, 'services_listed_by_tech', 'service', 'list', { techId: techId.toHexString(), count: data.length });

    return { data };
  }

  async getAllServices(limit?: number, skip?: number, needTimestamp?: boolean, sort?: 'asc' | 'desc'): Promise<{ data: FixService[] }> {
    console.log('Getting all services with limit:', limit, 'skip:', skip, 'needTimestamp:', needTimestamp, 'sort:', sort);
    const data = await this.serviceModel
      .find()
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .limit(limit || 200)
      .skip(skip || 0)
      .execLeanObject<FixService[]>({ timeStamp: needTimestamp ?? true });

    if (!data) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
    }
    return { data };
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const service = await this.serviceModel.findByIdAndDelete(id).lean().exec();
    if (!service) throw new RpcException({ code: status.NOT_FOUND, message: 'Service not found' });
  }
}
