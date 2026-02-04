import { Transport } from '@nestjs/microservices';
import { GRPC } from './ConstGrpc';

export function RabbitMQClientConfig(
  isClientSide: boolean,
  configService?: import('@nestjs/config').ConfigService,
): import('@nestjs/common/interfaces/nest-application-context-options.interface').NestApplicationContextOptions &
  import('@nestjs/microservices').RmqOptions {
  return {
    transport: 5, // Transport.RMQ
    options: {
      urls: [configService?.get<string>('RABBITMQ_URL') || process.env.RABBITMQ_URL!],
      queue: configService?.get<string>('RABBITMQ_QUEUE') || process.env.RABBITMQ_QUEUE!,
      queueOptions: {
        durable: true,
        arguments: {
          'x-message-ttl': 5000, // 5 seconds
          'x-dead-letter-exchange': 'retry.exchange', // Failed messages
        },
      },
      prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH || '10', 10),
      noAck: isClientSide,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
    logger: process.env.DEBUG === 'true' ? ['warn', 'error', 'log'] : [],
    bufferLogs: false,
    abortOnError: false,
  };
}

export function GrpcClientConfig(
  grpcPort: string,
  configService?: import('@nestjs/config').ConfigService,
): import('@nestjs/common/interfaces/nest-application-context-options.interface').NestApplicationContextOptions &
  import('@nestjs/microservices').GrpcOptions {
  const maxMessageSize = configService?.get<number>('GRPC_MAX_MESSAGE_SIZE') || parseInt(process.env.GRPC_MAX_MESSAGE_SIZE || '', 10 * 1024 * 1024); // 10MB
  //const grpcHost = process.env.GRPC_HOST || '0.0.0.0'; // 'localhost'
  const grpcHost = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  return {
    transport: Transport.GRPC,
    options: {
      url: `${grpcHost}:${grpcPort}`,
      package: GRPC.PACKAGES,
      protoPath: GRPC.PROTO_FILES,
      maxReceiveMessageLength: maxMessageSize,
      maxSendMessageLength: maxMessageSize,
      keepalive: {
        keepaliveTimeMs: 30000, // 30 seconds (was 120000)
        keepaliveTimeoutMs: 20000, // 20 seconds (was 20000)
        keepalivePermitWithoutCalls: 1,
        http2MinTimeBetweenPingsMs: 10000, // 10 seconds (was 60000)
        http2MaxPingsWithoutData: 0,
        http2MinPingIntervalWithoutDataMs: 0,
        http2MaxPingStrikes: 2,
      },
      channelOptions: {
        'grpc.keepalive_time_ms': 120000, // 2 min keepalive
        'grpc.keepalive_timeout_ms': 20000, // 20s timeout
        'grpc.keepalive_permit_without_calls': 1, // Allow pings
        'grpc.http2.min_time_between_pings_ms': 120000, // 2 min
        'grpc.http2.max_pings_without_data': 0, // Unlimited pings

        'grpc.max_connection_idle_ms': 600000, // 10 minutes
        'grpc.max_connection_age_ms': 1800000, // 30 minutes
        'grpc.max_connection_age_grace_ms': 60000, // 1 minute grace period
        'grpc.max_concurrent_streams': 100,
        'grpc.http2.write_buffer_size': 100 * 1024, // 100KB
      },
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      gracefulShutdown: true, // only ofr main
    },
  };
}
