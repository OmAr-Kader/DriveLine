import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user.module';
import { AuthModule } from './modules/auth.module';
import { AIMessageModule } from './modules/aiMessage.module';
import { AISessionModule } from './modules/aiSession.module';
import { GeminiModule } from './modules/gemini.module';
import { FixServicesModule } from './modules/fixService.module';
import { ShortVideoModule } from './modules/shortVideo.module';
import { CourseModule } from './modules/course.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available app-wide
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        autoIndex: config.get('DEBUG') === 'true',
      }),
    }),
    UserModule,
    AuthModule,
    ShortVideoModule,
    FixServicesModule,
    CourseModule,
    AIMessageModule,
    AISessionModule,
    GeminiModule,
  ],
})
export class AppModule {}
