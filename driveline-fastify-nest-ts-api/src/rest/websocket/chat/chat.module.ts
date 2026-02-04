import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { CHAT_DATABASE_CONNECTION } from '../common/database/chat-database.module';
import { RoomsModule } from '../rooms/rooms.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Room.name, schema: RoomSchema },
        { name: Message.name, schema: MessageSchema },
      ],
      CHAT_DATABASE_CONNECTION,
    ),
    RoomsModule,
  ],
  providers: [ChatGateway, ChatService, JwtService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
