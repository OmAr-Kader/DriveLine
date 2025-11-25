import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShortVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  link: string;

  @IsString()
  @IsNotEmpty()
  thumbImageName: string;

  @IsArray()
  @IsOptional()
  tags?: number[];
}

export class UpdateTagsDto {
  @IsArray()
  tags: number[];
}
