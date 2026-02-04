import './common/types/mongoose-extensions';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GrpcModule } from './grpc/grpc.module';
import { MicroserviceExceptionFilter } from './rest/flow-control/filters/micro-service-exception.filter';
import { AppConfigService } from './common/utils/AppConfigService';
import { GrpcClientConfig } from './common/utils/ConstConfig';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || '50051';
  const grpcConfig = GrpcClientConfig(grpcPort);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(GrpcModule, grpcConfig);

  // Global error handling
  app.enableShutdownHooks();

  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  shutdownSignals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`📥 Received ${signal}, initiating graceful shutdown...`);

      try {
        // Stop accepting new messages from gRPC
        console.log('🛑 Closing gRPC connections...');
        void app.close();

        console.log('✅ Worker shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
  });
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  // Global exception filter for microservice errors
  app.useGlobalFilters(new MicroserviceExceptionFilter(app.get(AppConfigService)));

  // Start listening to gRPC
  await app.listen();
  console.log(`✅ Connected to gRPC server on ${grpcPort}`);
  console.log('📡 Listening for messages...');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start gRPC server:', error);
  process.exit(1);
});
