import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
export class CreateGeminiDto {
  @IsOptional()
  @IsString()
  sessionId?: Types.ObjectId;

  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  saveQuestion?: boolean;
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

export class GeminiError extends Error {
  constructor(
    public type: string,
    public status?: number,
    public details?: string,
  ) {
    super(details);
  }
}
