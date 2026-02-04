import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecurringPriceDto {
  @IsEnum(['day', 'week', 'month', 'year'])
  interval: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  intervalCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trialPeriodDays?: number;
}

export class CreatePriceDto {
  @IsNumber()
  @Min(0)
  unitAmount: number;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringPriceDto)
  recurring?: RecurringPriceDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitLabel?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceDto)
  prices?: CreatePriceDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class UpdateProductDto {
  @IsString()
  @MaxLength(255)
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
