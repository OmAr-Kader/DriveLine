import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user.module';
import { AuthModule } from './modules/auth.module';
import { AIMessageModule } from './modules/aiMessage.module';
import { AISessionModule } from './modules/aiSession.module';
import { FixServicesModule } from './modules/fixService.module';
import { ShortVideoModule } from './modules/shortVideo.module';
import { CourseModule } from './modules/course.module';
import { GeminiModule } from './modules/gemini.module';
import { StatsModule } from './modules/stats.module';
import { GrpcClientModule } from './modules/client.grpc.module';
import { ChatDatabaseModule } from './websocket/common/database/chat-database.module';
import { RoomsModule } from './websocket/rooms/rooms.module';
import { ChatModule } from './websocket/chat/chat.module';
import { JwtModule } from '@nestjs/jwt';
import { FlowControlModule } from './flow-control/flow-control.module';
import { AppConfigModule } from '../common/utils/AppConfigService';
import { AnalyticsInterceptor } from './analytics/analytics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from './cache/cache.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RabbitMQModule } from 'src/common/rabbitMQ/rabbitMQ.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available app-wide
    }),
    RabbitMQModule,
    AnalyticsModule,
    AppConfigModule,
    GrpcClientModule,
    CacheModule.forRoot({
      valkeyUrl: process.env.VALKEY_URL,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          // default sign options — can be overridden per-sign
          algorithm: 'HS256',
          // do NOT set expiresIn here if you want "forever" tokens; better: use controlled policy
          // expiresIn: '1h',
        },
      }),
    }),
    FlowControlModule,

    UserModule,
    AuthModule,
    ShortVideoModule,
    FixServicesModule,
    CourseModule,
    AIMessageModule,
    AISessionModule,
    GeminiModule,
    StatsModule,

    ChatDatabaseModule,
    ChatModule,
    RoomsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AnalyticsInterceptor,
    },
  ],
})
export class APIModule {}
