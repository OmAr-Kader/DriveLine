import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateCourseDto, UpdateCourseDto } from 'src/dto/create.course.dto';
import { Course, CourseDocument } from 'src/schema/course.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
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

  async create(dto: CreateCourseDto) {
    const course = new this.courseModel(dto);
    return course.save();
  }

  async update(id: Types.ObjectId, dto: UpdateCourseDto) {
    const updated = await this.courseModel.findByIdAndUpdate(id, dto, { new: true }).lean().exec();

    if (!updated) throw new NotFoundException('Course not found');
    return updated;
  }

  async getCourseById(id: Types.ObjectId) {
    const pipeline = this.makePipeline({ $match: { _id: id } });

    const aggResult = await this.courseModel.aggregate(pipeline).allowDiskUse(false).exec();

    if (!aggResult || aggResult.length === 0) {
      throw new NotFoundException('Service not found');
    }

    return aggResult[0] as object;
  }

  async getCoursesByCourseAdminId(courseAdminId: number | string, isActive: boolean) {
    const match: object = { courseAdminId, isActive };

    const pipeline = this.makePipeline({ $match: match });

    const agg = this.courseModel.aggregate(pipeline).allowDiskUse(false);
    const courses = await agg.allowDiskUse(false).exec();

    return { data: courses };
  }

  async listByTech(techId: Types.ObjectId) {
    return this.courseModel.find({ techId }).sort({ createdAt: -1 }).lean().exec();
  }
}
