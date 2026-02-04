import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsBoolean, IsNotEmpty, IsArray, IsObject, IsIn } from 'class-validator';
import { Const } from '../utils/Const';
import { safeEnumTransform, safeNumberTransform } from '../utils/env';

export class Empty {}

export class BaseQueries {
  @Expose({ name: 'limit' })
  @Transform(({ value }: { value: string | undefined }) => safeNumberTransform(value))
  @IsOptional()
  @IsNumber()
  limit?: number | undefined;

  @Expose({ name: 'skip' })
  @Transform(({ value }: { value: string | undefined }) => safeNumberTransform(value))
  @IsOptional()
  @IsNumber()
  skip?: number | undefined;

  @Expose({ name: 'sort' })
  @Transform(({ value }: { value: string | undefined }) => safeEnumTransform(value, ['asc', 'desc']))
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' | undefined;

  @Expose({ name: Const.QNeedTimestamp })
  @Transform(({ value }: { value: string | undefined }) => (value !== undefined ? value === 'true' : undefined))
  @IsOptional()
  @IsBoolean()
  needTimestamp?: boolean | undefined;

  @Expose({ name: 'columns' })
  @IsOptional()
  @IsString()
  columns?: string | undefined;

  @Expose({ name: 'exclude' })
  @IsOptional()
  @IsString()
  exclude?: string | undefined;
}

export class BaseHeaders {
  @Expose({ name: Const.UserID })
  @IsString()
  @IsNotEmpty()
  currentUserId: string;

  @Expose({ name: Const.XCryptoKey })
  @IsOptional()
  @IsString()
  cryptoMode?: string | undefined;

  @Expose({ name: Const.ClientKeyBase64 })
  @IsOptional()
  @IsString()
  clientKeyBase64?: string | undefined;
}

export class MessageResponse {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class DataObjectsResponse {
  @IsArray()
  data: object[];
}

export class DataObjectResponse {
  @IsObject()
  data: object;
}

export class IdRequest {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class IdUserIdRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  currentUserId: string;
}

export class IdUserIdUndefinedRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  currentUserId?: string;
}

export class PaginationRequest {
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsNumber()
  @IsOptional()
  skip?: number;
}

// Generic error response
export class ErrorResponse {
  @IsString()
  @IsNotEmpty()
  error: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  statusCode: number;
}
