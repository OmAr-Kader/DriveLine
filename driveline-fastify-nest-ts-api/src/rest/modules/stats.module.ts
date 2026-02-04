import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StatsController } from '../controllers/stats.controller';

@Module({
  providers: [JwtService],
  controllers: [StatsController],
})
export class StatsModule {}
