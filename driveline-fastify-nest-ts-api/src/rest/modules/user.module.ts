import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { JwtService } from '@nestjs/jwt';
import { UserStripeController } from 'src/rest/controllers/user.stripe.controller';

@Module({
  providers: [JwtService],
  controllers: [UserController, UserStripeController],
})
export class UserModule {}
