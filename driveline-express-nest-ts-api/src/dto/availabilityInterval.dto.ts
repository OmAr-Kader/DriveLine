import { IsString } from 'class-validator';

export class AvailabilityIntervalDto {
  @IsString()
  startUTC: number;

  @IsString()
  endUTC: number;
}
