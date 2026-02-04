import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ConnectDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString({ each: true })
  @IsOptional()
  participantIds?: string[];
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
