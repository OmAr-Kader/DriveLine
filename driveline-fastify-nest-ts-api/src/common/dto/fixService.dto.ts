import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString, ValidateNested, IsNotEmpty, IsDefined, MaxLength, IsArray, IsInt, Min } from 'class-validator';
import { Types } from 'mongoose';
import { FixService } from '../schema/fixService.schema';
import { AvailabilityInterval } from '../schema/availabilityInterval.schema';
import { BaseQueries } from './common.dto';

export class CreateFixService {
  @IsInt()
  @Min(0)
  @IsDefined()
  serviceAdminId: number;

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
  durationMinutes?: number;

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

export class UpdateFixService {
  @IsOptional()
  @IsInt()
  @Min(0)
  serviceAdminId?: number;

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
  durationMinutes?: number;

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

export class CreateFixServiceRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateFixService)
  service: CreateFixService;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}

export class UpdateFixServiceRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateFixService)
  update: UpdateFixService;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}

export class GetServicesByServiceAdminIdRequest {
  @IsInt()
  @Min(0)
  @IsDefined()
  serviceAdminId: number;

  @IsBoolean()
  @IsDefined()
  isActive: boolean;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class ListByTechRequest {
  @IsMongoId()
  @IsNotEmpty()
  techId: string;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class GetAllServicesRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class CreateFixServiceResponse {
  @ValidateNested()
  @Type(() => FixService)
  service: FixService;
}

export class GetServicesResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixService)
  data: FixService[];
}
