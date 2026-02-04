import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from 'src/common/rabbitMQ/QueueService';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitMQClientConfig } from 'src/common/utils/ConstConfig';

@Global()
@Module({
  imports: [
    /*HttpModule.register({
      timeout: 10000, // Fail request if no response within 10s
      maxRedirects: 3, // Follow up to 3 redirects
      httpsAgent: new Agent({
        keepAlive: true, // Reuse TCP connections for better performance
        keepAliveMsecs: 30000, // Keep idle sockets alive for 30s
        maxSockets: 50, // Max concurrent sockets per host
        maxFreeSockets: 10, // Keep up to 10 idle sockets ready
        scheduling: 'lifo', // Prefer recently used sockets (avoids stale ones)
      }),
    }),*/
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => RabbitMQClientConfig(true, configService),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class RabbitMQModule {}
