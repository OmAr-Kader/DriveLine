import { IsString, IsBoolean, IsMongoId, IsNotEmpty, IsDefined, MaxLength, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AiMessage } from '../schema/aiMessage.schema';
export class CreateGeminiDto {
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @IsDefined()
  @IsBoolean()
  saveQuestion: boolean;

  @IsDefined()
  @IsBoolean()
  isTemp: boolean;
}

export class GenerateContentRequest {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateGeminiDto)
  data: CreateGeminiDto;
}

export class ErrorDetail {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  error: string;
}

export class GenerateContentResponse {
  @IsOptional()
  @ValidateNested()
  @Type(() => AiMessage)
  message?: AiMessage;

  @IsOptional()
  @ValidateNested()
  @Type(() => ErrorDetail)
  error?: ErrorDetail;
}

// models/gemini.ts

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
  }>;
}
