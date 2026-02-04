import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, IsDefined, MaxLength, IsInt, Min } from 'class-validator';
import { ShortVideo } from '../schema/shortVideo.schema';
import { BaseHeaders, BaseQueries } from './common.dto';
import { Type } from 'class-transformer';

// Existing or updated classes
export class CreateShortVideo {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  link: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  thumbImageName: string;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  @Min(0, { each: true })
  tags?: number[];
}

export class UpdateTags {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  tags: number[];
}

export class CreateShortVideoRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateShortVideo)
  video: CreateShortVideo;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class GetByUserIdRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;

  @ValidateNested()
  @Type(() => BaseHeaders)
  headers: BaseHeaders;
}

class ShortVideoList {
  @IsArray()
  videos: object[];
}

export class GetByUserIdResponse {
  @IsOptional()
  encrypted?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShortVideoList)
  data?: ShortVideoList;
}

export class GetByIdResponse {
  @ValidateNested()
  @Type(() => ShortVideo)
  data: ShortVideo;
}

export class FetchByTagRequest {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsString()
  @IsNotEmpty()
  currentUserId: string;

  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class FetchByTagResponse {
  @ValidateNested()
  @Type(() => ShortVideoList)
  data: ShortVideoList;
}

export class FetchLatestRequest {
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;

  @ValidateNested()
  @Type(() => BaseHeaders)
  headers: BaseHeaders;
}

export class FetchLatestResponse {
  @IsOptional()
  encrypted?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShortVideoList)
  data?: ShortVideoList;
}

export class IncrementViewsResponse {
  @IsInt()
  @Min(0)
  views: number;
}

export class UpdateTagsRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateTags)
  update: UpdateTags;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}

export class UpdateTagsResponse {
  @IsOptional()
  @ValidateNested()
  @Type(() => ShortVideo)
  data?: ShortVideo;
}

export class FetchAllRequest {
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}
