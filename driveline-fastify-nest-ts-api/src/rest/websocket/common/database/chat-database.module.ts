import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const CHAT_DATABASE_CONNECTION = 'chatConnection';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: CHAT_DATABASE_CONNECTION,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('MONGODB_URI')!;
        const debug = config.get('DEBUG') === 'true';
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
          autoIndex: debug,

          // ===== CONNECTION POOL (for websocket/chat traffic) =====
          maxPoolSize: 150, // 150 connections (chat is lower traffic)
          minPoolSize: 40, // Keep 40 warm
          // maxConnecting: 15,         // 15 parallel attempts

          // ===== QUEUE MANAGEMENT (same as main) =====
          waitQueueTimeoutMS: 20000, // 20s wait queue timeout

          // keepAlive: true,
          // keepAliveInitialDelay: 300000, // 5min (prevent connection drops)

          // ===== TIMEOUTS (can be slightly aggressive for real-time) =====
          connectTimeoutMS: 45000, // 45s connection timeout
          socketTimeoutMS: 90000, // 90s socket timeout
          serverSelectionTimeoutMS: 25000, // 25s server selection

          // ===== HEARTBEAT =====
          heartbeatFrequencyMS: 30000,
          minHeartbeatFrequencyMS: 10000,

          // ===== RELIABILITY =====
          retryWrites: true,
          retryReads: true,
          writeConcern: { w: 'majority', wtimeout: 15000 }, // Majority with 5s timeout

          // ===== READ OPTIMIZATION FOR CHAT =====
          readPreference: 'primaryPreferred', // Changed from 'primary' (too strict)
          readConcern: { level: 'local' }, // Keep local for speed
          localThresholdMS: 15000,

          // ===== NETWORK =====
          noDelay: true,
          compressors: snappyAvailable ? ['snappy', 'none'] : ['none'], // Snappy is faster for chat
          maxIdleTimeMS: 600000, // Same as main
          monitorCommands: false,
          // ===== CONNECTION =====
          directConnection: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class ChatDatabaseModule {}
