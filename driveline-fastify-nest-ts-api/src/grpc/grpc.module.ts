import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from 'src/common/utils/AppConfigService';
import { MongooseModule } from '@nestjs/mongoose';
import { ECDHEncryptionModule } from './crypto/ecdh-encryption.module';
import { UserModule } from './modules/user.module';
import { AIMessageModule } from './modules/aiMessage.module';
import { AISessionModule } from './modules/aiSession.module';
import { ShortVideoModule } from './modules/shortVideo.module';
import { AgendaModule } from 'src/rabbitmq/agenda/agenda.module';
import { AuthModule } from './modules/auth.module';
import { GeminiModule } from './modules/gemini.module';
import { CourseModule } from './modules/course.module';
import { FixServicesModule } from './modules/fixService.module';
import { StatsModule } from './modules/stats.module';
import { RabbitMQModule } from 'src/common/rabbitMQ/rabbitMQ.module';
import { DatabaseModule } from './modules/mongoose.module';

/*;
import { FixServiceGrpcController } from './controllers/fix-service.controller';
import { StatsGrpcController } from './controllers/stats.controller';
*/

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available app-wide
    }),
    RabbitMQModule,
    ECDHEncryptionModule,
    AppConfigModule,
    AgendaModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('MONGODB_URI')!;
        let snappyAvailable = false;
        try {
          // prefer resolve to avoid loading native module during import time
          require.resolve('snappy');
          snappyAvailable = true;
        } catch {
          snappyAvailable = false;
        }
        return {
          uri: url,
          autoIndex: false,
          autoCreate: false,

          // ===== CONNECTION POOL (optimized for 1000+ concurrent requests) =====
          maxPoolSize: 100, // Was 200
          minPoolSize: 40, // Was 75
          maxConnecting: 40, // Was 75
          //keepAlive: true,
          //keepAliveInitialDelay: 300000, // 5min (prevent connection drops)

          // ===== QUEUE & WAIT MANAGEMENT (crucial for high load) =====
          waitQueueTimeoutMS: 20000, // Wait 20s before rejecting (handles burst spikes)

          // ===== CONNECTION TIMEOUTS (aggressive but stable) =====
          connectTimeoutMS: 10000, // Aggressive connection timeout
          socketTimeoutMS: 45000, // Match API Gateway timeout
          serverSelectionTimeoutMS: 10000,

          // ===== HEARTBEAT & MONITORING =====
          heartbeatFrequencyMS: 30000, // Check every 30s (reduce overhead)
          minHeartbeatFrequencyMS: 10000, // Min 10s between checks

          // ===== RELIABILITY & WRITE CONCERN =====

          // ===== READ OPTIMIZATION =====

          retryReads: true,
          retryWrites: true,
          writeConcern: { w: 'majority', wtimeout: 5000 },
          readConcern: { level: 'available' }, // ⭐ CHANGED from 'majority' (faster)
          readPreference: 'secondaryPreferred',

          maxStalenessSeconds: 90, // ⭐ NEW: Bound staleness for secondaries
          localThresholdMS: 15000, // Only use servers within 15ms latency

          // ===== NETWORK OPTIMIZATION =====
          noDelay: true, // TCP_NODELAY - critical for low latency under load

          // ===== COMPRESSION (snappy is fastest for streaming) =====
          compressors: snappyAvailable ? ['snappy', 'zstd', 'none'] : ['zstd', 'none'],
          monitorCommands: false,
          // ===== CONNECTION POOLING =====
          directConnection: false, // Allow load balancing & replica set discovery
          maxIdleTimeMS: 600000, // Keep idle connections 10min (cheaper than reconnect)
        };
      },
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    ShortVideoModule,
    FixServicesModule,
    CourseModule,
    AIMessageModule,
    AISessionModule,
    GeminiModule,
    StatsModule,
  ],
})
export class GrpcModule {}
