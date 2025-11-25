import { IsString, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMessageDto {
  @IsString()
  sessionId: Types.ObjectId;

  @IsString()
  text: string;

  @IsBoolean()
  isUser: boolean;
}
