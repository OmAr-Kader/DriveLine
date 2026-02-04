import { IsString, IsBoolean, IsOptional, ValidateNested, IsNotEmpty, IsDefined, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { AiSession } from '../schema/aiSession.schema';
import { AiMessage } from '../schema/aiMessage.schema';
import { BaseHeaders, BaseQueries } from './common.dto';

export class CreateSession {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;
}

export class CreateSessionAndAddFirstMessagePayload {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @IsDefined()
  @IsBoolean()
  isUser: boolean;
}

export class CreateSessionAndFirstMessageRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateSessionAndAddFirstMessagePayload)
  payload: CreateSessionAndAddFirstMessagePayload;
}

export class CreateSessionRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateSession)
  payload: CreateSession;
}

export class ListSessionsRequest {
  @IsDefined()
  @ValidateNested()
  @Type(() => BaseQueries)
  queries: BaseQueries;

  @IsDefined()
  @ValidateNested()
  @Type(() => BaseHeaders)
  headers: BaseHeaders;
}

export class UpdateSessionTitleRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;

  @IsString()
  @IsNotEmpty()
  currentUserId: string;
}

export class CreateSessionAndFirstMessageResponse {
  @ValidateNested()
  @Type(() => AiSession)
  session: AiSession;

  @ValidateNested()
  @Type(() => AiMessage)
  message: AiMessage;
}

export class AISessionResponse {
  @ValidateNested()
  @Type(() => AiSession)
  session: AiSession;
}

export class ListSessionsResponse {
  @ValidateNested({ each: true })
  @Type(() => AiSession)
  sessions: AiSession[];
}
