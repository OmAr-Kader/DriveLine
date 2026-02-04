import { IsOptional, IsString, ValidateNested, IsNotEmpty, IsMongoId, IsArray, IsDefined, MaxLength } from 'class-validator';
import { Course } from 'src/common/schema/course.schema';
import { FixService } from 'src/common/schema/fixService.schema';
import { ShortVideo } from 'src/common/schema/shortVideo.schema';
import { User } from 'src/common/schema/user.schema';
import { MongoMetaObject } from '../types/mongoose-extensions';
import { Type } from 'class-transformer';
import { BaseQueries, BaseHeaders } from './common.dto';

export class GetAllUsersRequest {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;
}

export class GetAllUsersResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => User)
  users: (User & MongoMetaObject)[];
}

export class GetUserByIdRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsMongoId()
  @IsNotEmpty()
  currentUser: string;
  @IsOptional()
  @IsString()
  columns?: string;
  @IsOptional()
  @IsString()
  exclude?: string;
}

export class GetUserByIdResponse {
  @IsOptional()
  @ValidateNested()
  @Type(() => User)
  user: User | null;
}

export class UpdateUserRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsDefined()
  data: Partial<User>; // Assuming PartialUser is defined or use Partial<User>
}

export class UpdateUserResponse {
  @ValidateNested()
  @Type(() => User)
  user: User;
}

export class DeleteUserRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class DeleteUserResponse {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class GetProfileByIdRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;

  @ValidateNested()
  @Type(() => BaseHeaders)
  headers: BaseHeaders;
}

export class ProfileData {
  @ValidateNested()
  @Type(() => User)
  user: User;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixService)
  services: FixService[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Course)
  courses: Course[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShortVideo)
  shorts: ShortVideo[];
}

export class GetProfileByIdResponse {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileData)
  profile?: ProfileData;

  @IsOptional()
  encrypted?: string;
}
