import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { WorkerModule } from './rabbitmq/worker-module';
import { RabbitMQClientConfig } from './common/utils/ConstConfig';
import { MicroserviceExceptionFilter } from './rest/flow-control/filters/micro-service-exception.filter';
import { AppConfigService } from './common/utils/AppConfigService';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const rabbitMqConfig = RabbitMQClientConfig(false);
  console.log(`🚀 Worker (Microservice) `, rabbitMqConfig.options?.urls);

  // Create microservice using the transport config (RabbitMQ). Do not pass the Fastify HTTP adapter
  // as a transport strategy — it does not implement microservice server handlers and causes
  // `serverInstance.addHandler is not a function` at runtime.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(WorkerModule, rabbitMqConfig);

  // Global error handling
  app.enableShutdownHooks();
  const config = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      skipUndefinedProperties: true,
      skipNullProperties: true,
      skipMissingProperties: true,
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      forbidNonWhitelisted: true,
      disableErrorMessages: !config.isDebug,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludePrefixes: ['_', '__'], // Exclude private fields
    }),
  );

  // Graceful shutdown handlers
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  shutdownSignals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`📥 Received ${signal}, initiating graceful shutdown...`);

      try {
        // Stop accepting new messages from RabbitMQ
        console.log('🛑 Closing RabbitMQ connections...');
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
  app.useGlobalFilters(new MicroserviceExceptionFilter(config));

  // Start listening to RabbitMQ
  await app.listen();

  console.log('✅ Connected to RabbitMQ');
  console.log('⚡ Worker ready');
  console.log('📡 Listening for messages...');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start worker server:', error);
  process.exit(1);
});
