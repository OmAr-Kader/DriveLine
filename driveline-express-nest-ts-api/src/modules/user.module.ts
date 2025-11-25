import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schema/user.schema';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { ShortVideo, ShortVideoSchema } from 'src/schema/shortVideo.schema';
import { FixService, FixServiceSchema } from 'src/schema/fixService.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ShortVideo.name, schema: ShortVideoSchema },
      { name: FixService.name, schema: FixServiceSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
