import { Global, Module } from '@nestjs/common';
import { GrpcClientService } from '../services/grpc-client.service';

@Global()
@Module({
  providers: [GrpcClientService],
  exports: [GrpcClientService],
})
export class GrpcClientModule {}
