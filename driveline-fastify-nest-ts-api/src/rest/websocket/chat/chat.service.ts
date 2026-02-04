import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CHAT_DATABASE_CONNECTION } from '../common/database/chat-database.module';
import { randomUUID } from 'crypto';
import { transactionFullHandler } from 'src/common/utils/mongo-helper';
import { LoggerKit } from 'src/common/utils/LogKit';

@Injectable()
export class ChatService {
  private readonly logger = LoggerKit.create(ChatService.name);

  constructor(
    @InjectModel(Room.name, CHAT_DATABASE_CONNECTION)
    private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Message.name, CHAT_DATABASE_CONNECTION)
    private readonly messageModel: Model<MessageDocument>,
    @InjectConnection(CHAT_DATABASE_CONNECTION)
    private readonly connection: Connection,
  ) {}

  /**
   * Find or create a room for the given participants
   */
  async findOrCreateRoom(roomId: string | undefined, userId: string, participantIds?: string[]): Promise<Room> {
    // If roomId provided, try to find existing room
    if (roomId) {
      const existingRoom = await this.roomModel.findOne({ roomId, isActive: true }).lean().exec();

      if (existingRoom) {
        // Add user to room if not already a participant
        if (!existingRoom.userIds.includes(userId)) {
          await this.roomModel.updateOne(
            { roomId },
            {
              $addToSet: { userIds: userId },
              $set: { lastActivityAt: new Date() },
            },
          );
          existingRoom.userIds.push(userId);
        }
        return existingRoom;
      }
    }

    // Create new room
    const newRoomId = roomId || randomUUID();
    const allParticipants = new Set([userId, ...(participantIds || [])]);

    const newRoom = await this.roomModel.create({
      roomId: newRoomId,
      userIds: Array.from(allParticipants),
      type: allParticipants.size > 2 ? 'group' : 'direct',
      lastActivityAt: new Date(),
    });

    this.logger?.log(`Created new room: ${newRoomId}`);
    return newRoom.toObject();
  }

  /**
   * Save a message and update room's last message atomically
   */
  async saveMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    metadata?: Record<string, any>,
  ): Promise<Message> {
    const message = transactionFullHandler(async (session) => {
      const message = await this.messageModel.create(
        [
          {
            roomId,
            senderId,
            content,
            type,
            metadata: metadata || {},
            deliveredTo: [senderId],
            readBy: [senderId],
          },
        ],
        session ? { session } : undefined,
      );

      const lastMessage = {
        content: type === 'text' ? content : `Sent ${type}`,
        senderId,
        timestamp: new Date(),
        type,
      };

      await this.roomModel.updateOne(
        { roomId },
        {
          $set: {
            lastMessage,
            lastActivityAt: new Date(),
          },
        },
        session ? { session } : undefined,
      );
      return message[0].toObject();
    });
    return message;
  }

  /**
   * Get messages for a room with pagination
   */
  async getRoomMessages(roomId: string, limit: number = 50, before?: Date): Promise<Message[]> {
    const query: {
      roomId: string;
      isDeleted: boolean;
      createdAt?: { $lt: Date };
    } = { roomId, isDeleted: false };

    if (before) {
      query.createdAt = { $lt: before };
    }

    return this.messageModel.find(query).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  /**
   * Get all rooms for a user
   */
  async getUserRooms(userId: string, limit: number = 50, offset: number = 0): Promise<Room[]> {
    return this.roomModel
      .find({
        userIds: userId,
        isActive: true,
      })
      .sort({ lastActivityAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId: string): Promise<Room | null> {
    return this.roomModel.findOne({ roomId, isActive: true }).lean().exec();
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomId: string): Promise<string[]> {
    const room = await this.roomModel.findOne({ roomId }).select('userIds').lean().exec();
    return room?.userIds || [];
  }

  /**
   * Mark messages as read
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async markMessagesAsRead(roomId: string, userId: string, lastMessageId?: string): Promise<number> {
    const query: {
      roomId: string;
      readBy: { $ne: string };
    } = {
      roomId,
      readBy: { $ne: userId },
    };

    const result = await this.messageModel.updateMany(query, {
      $addToSet: { readBy: userId },
    });

    return result.modifiedCount;
  }

  /**
   * Mark messages as delivered
   */
  async markMessagesAsDelivered(roomId: string, userId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        roomId,
        deliveredTo: { $ne: userId },
      },
      {
        $addToSet: { deliveredTo: userId },
      },
    );
  }

  /**
   * Remove user from room (soft leave)
   */
  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const result = await this.roomModel.updateOne({ roomId }, { $pull: { userIds: userId } });
    return result.modifiedCount > 0;
  }

  /**
   * Get unread count for a user in a room
   */
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      roomId,
      readBy: { $ne: userId },
      senderId: { $ne: userId },
      isDeleted: false,
    });
  }
}
