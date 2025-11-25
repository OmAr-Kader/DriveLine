import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { AvailabilityIntervalDto } from './availabilityInterval.dto';
import { Types } from 'mongoose';

export class CreateCourseDto {
  @IsNumber()
  courseAdminId: number;

  @IsMongoId()
  techId: Types.ObjectId;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  sessions?: number;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  images?: string[];

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  monday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  tuesday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  wednesday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  thursday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  friday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  saturday?: AvailabilityIntervalDto;

  @IsOptional()
  @Type(() => AvailabilityIntervalDto)
  sunday?: AvailabilityIntervalDto;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
