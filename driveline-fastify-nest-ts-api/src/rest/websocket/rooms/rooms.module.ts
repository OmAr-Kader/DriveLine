import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { Room, RoomSchema } from '../chat/schemas/room.schema';
import { Message, MessageSchema } from '../chat/schemas/message.schema';
import { RoomSummary, RoomSummarySchema } from './schemas/room-summary.schema';
import { CHAT_DATABASE_CONNECTION } from '../common/database/chat-database.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Room.name, schema: RoomSchema },
        { name: Message.name, schema: MessageSchema },
        { name: RoomSummary.name, schema: RoomSummarySchema },
      ],
      CHAT_DATABASE_CONNECTION,
    ),
  ],
  providers: [RoomsGateway, RoomsService, JwtService],
  exports: [RoomsService],
})
export class RoomsModule {}
