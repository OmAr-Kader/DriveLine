import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FixServicesController } from 'src/controllers/fixServices.controller';
import { FixServiceSchema, FixService } from 'src/schema/fixService.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { FixServicesService } from 'src/services/fixService.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FixService.name, schema: FixServiceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [FixServicesService],
  controllers: [FixServicesController],
  exports: [FixServicesService],
})
export class FixServicesModule {}
