import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../chat/schemas/room.schema';
import { RoomSummary, RoomSummaryDocument } from './schemas/room-summary.schema';
import { Message, MessageDocument } from '../chat/schemas/message.schema';
import { CHAT_DATABASE_CONNECTION } from '../common/database/chat-database.module';
import { Server } from 'socket.io';
import { LoggerKit } from 'src/common/utils/LogKit';

@Injectable()
export class RoomsService {
  private readonly logger = LoggerKit.create(RoomsService.name);
  private server: Server;

  constructor(
    @InjectModel(Room.name, CHAT_DATABASE_CONNECTION)
    private readonly roomModel: Model<RoomDocument>,
    @InjectModel(RoomSummary.name, CHAT_DATABASE_CONNECTION)
    private readonly roomSummaryModel: Model<RoomSummaryDocument>,
    @InjectModel(Message.name, CHAT_DATABASE_CONNECTION)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Get all rooms for a user with summary data
   */
  async getUserRoomsWithSummary(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    // Get room summaries for user
    const summaries = await this.roomSummaryModel
      .find({ userId })
      .sort({ isPinned: -1, 'lastMessage.timestamp': -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    if (summaries.length === 0) {
      // Fallback: get rooms directly if no summaries exist
      const rooms = await this.roomModel
        .find({ userIds: userId, isActive: true })
        .sort({ lastActivityAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      // Create summaries for these rooms
      const roomsWithSummary = await Promise.all(
        rooms.map(async (room) => {
          const unreadCount = await this.getUnreadCount(room.roomId, userId);
          return {
            ...room,
            unreadCount,
            isMuted: false,
            isPinned: false,
          };
        }),
      );

      return roomsWithSummary;
    }

    // Enrich summaries with room data
    const roomIds = summaries.map((s) => s.roomId);
    const rooms = await this.roomModel
      .find({ roomId: { $in: roomIds } })
      .lean()
      .exec();

    const roomMap = new Map(rooms.map((r) => [r.roomId, r]));

    return summaries.map((summary) => ({
      ...roomMap.get(summary.roomId),
      unreadCount: summary.unreadCount,
      isMuted: summary.isMuted,
      isPinned: summary.isPinned,
      lastMessage: summary.lastMessage || roomMap.get(summary.roomId)?.lastMessage,
    }));
  }

  /**
   * Handle new message - update all participants' summaries
   */
  async handleNewMessage(
    roomId: string,
    lastMessage: {
      content: string;
      senderId: string;
      timestamp: Date;
      type: string;
    },
  ): Promise<void> {
    const room = await this.roomModel.findOne({ roomId }).select('userIds').lean().exec();

    if (!room) return;

    // Update or create summary for each participant
    const bulkOps = room.userIds.map((participantId) => ({
      updateOne: {
        filter: { roomId, userId: participantId },
        update: {
          $set: { lastMessage },
          $inc: {
            unreadCount: participantId === lastMessage.senderId ? 0 : 1,
          },
        },
        upsert: true,
      },
    }));

    await this.roomSummaryModel.bulkWrite(bulkOps);

    // Emit room list update to all participants
    this.notifyRoomListUpdate(room.userIds, roomId, lastMessage);
  }

  /**
   * Update unread count after marking messages as read
   */
  async updateUnreadCount(roomId: string, userId: string): Promise<void> {
    await this.roomSummaryModel.updateOne(
      { roomId, userId },
      {
        $set: {
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Notify user's other devices
    if (this.server) {
      this.server.to(`user:${userId}`).emit('room_read', { roomId });
    }
  }

  /**
   * Notify users about room updates
   */
  async notifyRoomUpdate(roomId: string, userIds: string[]): Promise<void> {
    if (!this.server) return;

    const room = await this.roomModel.findOne({ roomId }).lean().exec();
    if (!room) return;

    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('room_updated', {
        roomId,
        room,
        timestamp: new Date(),
      });
    });
  }

  /**
   * Notify users about room list changes
   */
  private notifyRoomListUpdate(
    userIds: string[],
    roomId: string,
    lastMessage: {
      content: string;
      senderId: string;
      timestamp: Date;
      type: string;
    },
  ): void {
    if (!this.server) return;

    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('room_list_update', {
        roomId,
        lastMessage,
      });
    });
  }

  /**
   * Get unread message count for a user in a room
   */
  private async getUnreadCount(roomId: string, userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      roomId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      isDeleted: false,
    });
  }

  /**
   * Toggle room pin status
   */
  async togglePinRoom(roomId: string, userId: string): Promise<boolean> {
    const summary = await this.roomSummaryModel.findOne({ roomId, userId });
    const newPinStatus = !summary?.isPinned;

    await this.roomSummaryModel.updateOne({ roomId, userId }, { $set: { isPinned: newPinStatus } }, { upsert: true });

    return newPinStatus;
  }

  /**
   * Toggle room mute status
   */
  async toggleMuteRoom(roomId: string, userId: string): Promise<boolean> {
    const summary = await this.roomSummaryModel.findOne({ roomId, userId });
    const newMuteStatus = !summary?.isMuted;

    await this.roomSummaryModel.updateOne({ roomId, userId }, { $set: { isMuted: newMuteStatus } }, { upsert: true });

    return newMuteStatus;
  }
}
