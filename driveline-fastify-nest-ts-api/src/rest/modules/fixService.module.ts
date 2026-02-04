import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FixServicesController } from '../controllers/fixServices.controller';

@Module({
  providers: [JwtService],
  controllers: [FixServicesController],
})
export class FixServicesModule {}
