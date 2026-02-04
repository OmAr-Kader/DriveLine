import { IsNumber } from 'class-validator';

export class CountResponse {
  @IsNumber()
  count: number;
}

export class GetAllCountsResponse {
  @IsNumber()
  users: number;

  @IsNumber()
  fixServices: number;

  @IsNumber()
  courses: number;

  @IsNumber()
  shortVideos: number;
}
