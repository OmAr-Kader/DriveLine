import { Controller, Get, Query, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RoomsService } from '../rooms/rooms.service';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { Priority } from 'src/rest/flow-control/decorators/priority.decorator';
import { Const } from 'src/common/utils/Const';

@Controller('chat')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly roomsService: RoomsService,
  ) {}

  /**
   * GET /chat/rooms? userId=xxx
   * Get all rooms that the user is a participant of
   */
  @Get('rooms')
  @Priority('critical')
  async getUserRooms(@Query(Const.UserID) userId: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }

    const rooms = await this.roomsService.getUserRoomsWithSummary(userId, limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);

    return {
      success: true,
      data: rooms,
      count: rooms.length,
      timestamp: new Date(),
    };
  }

  /**
   * GET /chat/rooms/:roomId
   * Get specific room details
   */
  @Get('rooms/:roomId')
  @Priority('high')
  async getRoomById(@Param('roomId') roomId: string) {
    const room = await this.chatService.getRoomById(roomId);

    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: room,
      timestamp: new Date(),
    };
  }

  /**
   * GET /chat/rooms/:roomId/messages
   * Get messages for a room with pagination
   */
  @Get('rooms/:roomId/messages')
  @Priority('high')
  async getRoomMessages(@Param('roomId') roomId: string, @Query('limit') limit?: string, @Query('before') before?: string) {
    const messages = await this.chatService.getRoomMessages(roomId, limit ? parseInt(limit, 10) : 50, before ? new Date(before) : undefined);

    return {
      success: true,
      data: messages.reverse(),
      count: messages.length,
      hasMore: messages.length === (limit ? parseInt(limit, 10) : 50),
      timestamp: new Date(),
    };
  }

  /**
   * GET /chat/rooms/:roomId/participants
   * Get participants of a room
   */
  @Get('rooms/:roomId/participants')
  @Priority('high')
  async getRoomParticipants(@Param('roomId') roomId: string) {
    const participants = await this.chatService.getRoomParticipants(roomId);

    return {
      success: true,
      data: participants,
      count: participants.length,
      timestamp: new Date(),
    };
  }

  /**
   * GET /chat/rooms/:roomId/unread? userId=xxx
   * Get unread count for a user in a room
   */
  @Get('rooms/:roomId/unread')
  @Priority('critical')
  async getUnreadCount(@Param('roomId') roomId: string, @Query(Const.UserID) userId: string) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }

    const count = await this.chatService.getUnreadCount(roomId, userId);

    return {
      success: true,
      data: { unreadCount: count },
      timestamp: new Date(),
    };
  }
}
