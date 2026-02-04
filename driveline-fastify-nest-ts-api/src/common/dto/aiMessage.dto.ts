import {
  IsString,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsDefined,
  MaxLength,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AiMessage } from '../schema/aiMessage.schema';
import { BaseHeaders, BaseQueries } from './common.dto';

export class CreateAIMessage {
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @IsDefined()
  @IsBoolean()
  isUser: boolean;
}

export class CreateMessageFromServer {
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;

  @IsDefined()
  @IsBoolean()
  saveQuestion: boolean;
}

export class CreateMessageRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateAIMessage)
  payload: CreateAIMessage;

  @IsString()
  @IsNotEmpty()
  currentUserId: string;
}

export class GetMessagesBySessionRequest {
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseHeaders)
  headers: BaseHeaders;
}

export class UpdateMessageRequest {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  currentUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @IsOptional()
  @IsBoolean()
  isUser?: boolean;
}

export class DeleteMessageRequest {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];

  @IsString()
  @IsNotEmpty()
  currentUserId: string;
}

export class CreateMessageFromServerRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateMessageFromServer)
  payload: CreateMessageFromServer;
}

export class GetAIMessageResponse {
  @ValidateNested()
  @Type(() => AiMessage)
  message: AiMessage;
}

export class GetAIMessagesBySessionResponse {
  @ValidateNested({ each: true })
  @Type(() => AiMessage)
  messages: AiMessage[];
}
