import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateCourse, UpdateCourse } from 'src/common/dto/course.dto';
import { Course, CourseDocument } from 'src/common/schema/course.schema';
import { QueueService } from 'src/common/rabbitMQ/QueueService';
import { normalizeObject } from 'src/common/types/mongoose-extensions';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
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

  private async executeAggregationStages(stages: PipelineStage[]): Promise<any[]> {
    return this.courseModel.aggregate(stages).exec();
  }

  async create(dto: CreateCourse, currentUser: string): Promise<{ course: Course }> {
    const saved = await this.courseModel.create(dto);
    const course = saved.toObject();
    this.queueService.trackActivity(currentUser, 'course_created', 'course', course.id, { price: dto.price, isActive: dto.isActive });

    return { course };
  }

  async update(id: Types.ObjectId, dto: UpdateCourse, currentUser: string): Promise<{ course: Course }> {
    const toUpdate = normalizeObject(dto);

    const course = await this.courseModel.findByIdAndUpdate(id, toUpdate, { new: true }).execLeanObject<Course>();
    if (!course) throw new RpcException({ code: status.NOT_FOUND, message: 'Course not found' });

    this.queueService.trackActivity(currentUser, 'course_updated', 'course', id.toHexString(), { updatedFields: Object.keys(dto) });

    return { course };
  }

  async getCourseById(id: Types.ObjectId, currentUser: string): Promise<{ course: object }> {
    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages({ $match: { _id: id } }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages());

    const aggResult = await this.executeAggregationStages(pipeline);

    if (!aggResult || aggResult.length === 0) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Course not found' });
    }

    const course = aggResult[0] as object;
    this.queueService.trackActivity(currentUser, 'course_viewed', 'course', id.toHexString(), { courseId: id.toHexString() });

    return { course };
  }

  async getCoursesByCourseAdminId(
    courseAdminId: number | string,
    isActive: boolean,
    currentUser: string,
    limit?: number,
    skip?: number,
  ): Promise<{ data: object[] }> {
    // Build pipeline in stages
    const pipeline: PipelineStage[] = [];
    pipeline.push(...this.getInitialStages([{ $match: { courseAdminId, isActive } }, { $sort: { createdAt: -1 } }]));
    pipeline.push(...this.getPaginationStages({ limit: limit || 30, skip: skip || 0 }));
    pipeline.push(...this.getLookupStages());
    pipeline.push(...this.getTransformStages({ timestamp: true }));

    const courses = await this.executeAggregationStages(pipeline);

    this.queueService.trackActivity(currentUser, 'courses_listed', 'course', 'list', { courseAdminId, count: courses.length, isActive });

    return { data: courses as object[] };
  }

  async listByTech(techId: Types.ObjectId, currentUser: string, limit?: number, skip?: number): Promise<{ data: Course[] }> {
    const data = await this.courseModel
      .find({ techId })
      .sort({ createdAt: -1 })
      .limit(limit || 30)
      .skip(skip || 0)
      .execLeanObject<Course[]>();
    this.queueService.trackActivity(currentUser, 'courses_listed_by_tech', 'course', 'list', { techId: techId.toHexString(), count: data.length });
    return { data };
  }

  async getAllCourses(limit?: number, skip?: number, needTimestamp?: boolean, sort?: 'asc' | 'desc'): Promise<{ data: Course[] }> {
    //const result = await this.workerThread.executeAggregation(pipeline);

    const data = await this.courseModel
      .find()
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .limit(limit || 200)
      .skip(skip || 0)
      .execLeanObject<Course[]>({ timeStamp: needTimestamp ?? true });
    if (!data) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Course not found' });
    }
    return { data };
  }

  async delete(id: Types.ObjectId): Promise<{ message: string }> {
    const course = await this.courseModel.findByIdAndDelete(id).lean().exec();
    if (!course) throw new RpcException({ code: status.NOT_FOUND, message: 'Course not found' });

    //const userId = String(course.techId ?? '');
    //this.trackActivity(userId, 'course_deleted', 'course', id.toHexString(), { price: course.price });
    return { message: 'Deleted successfully' };
  }
}
