import { Module } from '@nestjs/common';
import { FixServicesService } from 'src/grpc/services/fixService.service';
import { FixServicesController } from '../controllers/fixServices.controller';

@Module({
  providers: [FixServicesService],
  controllers: [FixServicesController],
  exports: [FixServicesService],
})
export class FixServicesModule {}
