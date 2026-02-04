import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
