import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['text', 'image', 'file'])
  @IsOptional()
  type?: 'text' | 'image' | 'file' = 'text';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TypingDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsOptional()
  isTyping?: boolean = true;
}

export class MarkReadDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsOptional()
  lastMessageId?: string;
}
