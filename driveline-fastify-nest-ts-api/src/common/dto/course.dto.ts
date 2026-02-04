import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString, ValidateNested, IsNotEmpty, IsDefined, MaxLength, IsArray, IsInt, Min } from 'class-validator';
import { Types } from 'mongoose';
import { Course } from '../schema/course.schema';
import { AvailabilityInterval } from '../schema/availabilityInterval.schema';
import { BaseQueries } from './common.dto';

export class CreateCourse {
  @IsInt()
  @Min(0)
  @IsDefined()
  courseAdminId: number;

  @IsMongoId()
  @IsNotEmpty()
  techId: Types.ObjectId | string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  price: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessions?: number;

  @IsBoolean()
  @IsDefined()
  isActive: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  monday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  tuesday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  wednesday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  thursday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  friday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  saturday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  sunday?: AvailabilityInterval;
}

export class UpdateCourse {
  @IsOptional()
  @IsInt()
  @Min(0)
  courseAdminId: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  price?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessions?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  monday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  tuesday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  wednesday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  thursday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  friday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  saturday?: AvailabilityInterval;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityInterval)
  sunday?: AvailabilityInterval;
}

export class CreateCourseRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateCourse)
  course: CreateCourse;

  @IsString()
  @IsNotEmpty()
  currentUser: string;
}

export class UpdateCourseRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateCourse)
  update: UpdateCourse;

  @IsString()
  @IsNotEmpty()
  currentUser: string;
}

export class GetCoursesByCourseAdminIdRequest {
  @IsInt()
  @Min(0)
  @IsDefined()
  courseAdminId: number;

  @IsBoolean()
  @IsDefined()
  isActive: boolean;

  @IsString()
  @IsNotEmpty()
  currentUser: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class ListByTechRequest {
  @IsMongoId()
  @IsNotEmpty()
  techId: string;

  @IsString()
  @IsNotEmpty()
  currentUser: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class GetAllCoursesRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class CreateCourseResponse {
  @ValidateNested()
  @Type(() => Course)
  course: Course;
}

export class GetCoursesResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Course)
  data: Course[];
}
