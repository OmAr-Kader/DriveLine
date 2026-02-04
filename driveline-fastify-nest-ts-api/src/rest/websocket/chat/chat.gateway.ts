/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { BadGatewayException, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RoomsService } from '../rooms/rooms.service';
import { populateAuthData, type AuthenticatedSocket } from '../common/interfaces/socket.interface';
import { ConnectDto, JoinRoomDto } from './dto/connect.dto';
import { BaseGateway } from '../common/gateways/base';
import { SendMessageDto, TypingDto, MarkReadDto } from './dto/send-message';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { ConsoleKit } from 'src/common/utils/LogKit';
import { WsThrottleGuard } from 'src/rest/flow-control/guards/rate-limit.guard';
import { WsThrottle } from 'src/rest/flow-control/decorators/priority.decorator';

/**
 * -> SEND EVENTS:
 * 1- { "connect_chat", { userId, roomId?, participantIds? } }
 * 2- { "send_message", { roomId, content, type?, metadata? } }
 * 3- { "typing", { roomId, isTyping? } }
 * 4- { "mark_read", { roomId, lastMessageId } }
 * 5- { "join_room", { roomId } }
 * 6- { "leave_room", { roomId } }
 * 7- { "get_messages", { roomId, limit?, before? } }
 *
 * -> RECEIVE EVENTS:
 * 1- { "connected", { roomId, room, messages, participants } }
 * 2- { "message_sent", { messageId } }
 * 3- { "new_message", { message } }
 * 4- { "user_typing", { userId, roomId, isTyping, timestamp } }
 * 5- { "messages_read", { userId, roomId, readCount, timestamp } }
 * 6- { "room_joined", { roomId, room, messages } }
 * 7- { "room_left", { roomId } }
 * 8- { "messages_history", { roomId, messages, hasMore } }
 * 9- { "user_joined", { userId, roomId, timestamp } }
 * 10-{ "user_left", { userId, roomId, timestamp } }
 * 11-{ "user_offline", { userId, roomId, timestamp }
 *
 * Main Chat Gateway for real-time messaging
 * Handles: connection, messaging, typing indicators, read receipts
 */
@WsThrottle(100, 10000) // 100 messages per 10 seconds max
@UseGuards(JwtAuthGuard, WsThrottleGuard)
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket'], //'polling' for http long-polling fallback act like socket
  pingInterval: 25000, // Keep connections alive
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB max message
  perMessageDeflate: {
    threshold: 1024, // Compress > 1KB
  },
})
export class ChatGateway extends BaseGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly roomsService: RoomsService,
  ) {
    super('ChatGateway');
  }

  /**
   * Handle user connection and room joining
   * Creates room if roomId is empty
   */
  @SubscribeMessage('connect_chat')
  async handleConnectChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: ConnectDto): Promise<void> {
    populateAuthData(client);

    ConsoleKit.logKit('handleConnectChat ConnectedSocket:', client.userId);
    ConsoleKit.logKit('handleConnectChat ConnectedSocket:', client.roomIds);

    try {
      const { userId, roomId, participantIds } = payload;

      // Register the user
      client.userId = userId;
      this.registerUser(userId, client.id);

      // Find or create room
      const room = await this.chatService.findOrCreateRoom(roomId, userId, participantIds);

      // Join the socket room
      await this.joinRoom(client, room.roomId);

      // Mark existing messages as delivered
      await this.chatService.markMessagesAsDelivered(room.roomId, userId);

      // Get recent messages for the room
      const messages = await this.chatService.getRoomMessages(room.roomId, 50);

      // Notify room about new user joining
      this.broadcastToRoom(
        room.roomId,
        'user_joined',
        {
          userId,
          roomId: room.roomId,
          timestamp: new Date(),
        },
        client.id,
      );

      // Update room summary for all participants
      await this.roomsService.notifyRoomUpdate(room.roomId, room.userIds);

      // Send success response with room data
      this.emitAck(client, 'connected', true, {
        roomId: room.roomId,
        room,
        messages: messages.reverse(), // Oldest first
        participants: room.userIds,
      });

      ConsoleKit.logKit(`User ${userId} connected to room ${room.roomId}`);
    } catch (error) {
      ConsoleKit.logKit(`Connection error: ${error}`);
      this.emitAck(client, 'connected', false, null, error);
    }
  }

  /**
   * Handle sending messages
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: SendMessageDto): Promise<void> {
    populateAuthData(client);

    ConsoleKit.logKit('handleConnectChat ConnectedSocket:', client.userId);

    try {
      const userId = client.userId;
      if (!userId) {
        throw new BadGatewayException('User not authenticated');
      }

      const { roomId, content, type, metadata } = payload;

      // Verify user is in the room
      const room = await this.chatService.getRoomById(roomId);
      if (!room || !room.userIds.includes(userId)) {
        throw new BadGatewayException('Not authorized to send messages in this room');
      }

      // Save message
      const message = await this.chatService.saveMessage(roomId, userId, content, type, metadata);

      // Broadcast to all users in room (including sender for confirmation)
      this.broadcastToRoom(
        roomId,
        'new_message',
        {
          ...message,
          roomId,
        },
        client.id,
      );

      // Update room summaries for all participants
      await this.roomsService.handleNewMessage(roomId, {
        content: type === 'text' ? content : `Sent ${type}`,
        senderId: userId,
        timestamp: new Date(),
        type: type ?? '',
      });

      this.emitAck(client, 'message_sent', true, { messageId: (message as any)._id });
    } catch (error: any) {
      ConsoleKit.logKit(`Send message error: ${error.message}`);
      this.emitAck(client, 'message_sent', false, null, error.message);
    }
  }

  /**
   * Handle typing indicators
   */
  @SubscribeMessage('typing')
  async handleTyping(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: TypingDto): Promise<void> {
    populateAuthData(client);

    const userId = client.userId;
    if (!userId) return;

    const { roomId, isTyping } = payload;

    // Broadcast typing status to other users in room
    this.broadcastToRoom(
      roomId,
      'user_typing',
      {
        userId,
        roomId,
        isTyping: isTyping ?? true,
        timestamp: new Date(),
      },
      client.id,
    );
  }

  /**
   * Handle marking messages as read
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: MarkReadDto): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) return;

      const { roomId, lastMessageId } = payload;

      const readCount = await this.chatService.markMessagesAsRead(roomId, userId, lastMessageId);

      // Notify other users about read receipt
      this.broadcastToRoom(
        roomId,
        'messages_read',
        {
          userId,
          roomId,
          readCount,
          timestamp: new Date(),
        },
        client.id,
      );

      // Update room summary
      await this.roomsService.updateUnreadCount(roomId, userId);
    } catch (error) {
      ConsoleKit.logKit(`Mark read error: ${error.message}`);
    }
  }

  /**
   * Handle joining additional rooms
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: JoinRoomDto): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) {
        throw new BadGatewayException('User not authenticated');
      }

      const room = await this.chatService.findOrCreateRoom(payload.roomId, userId);

      await this.joinRoom(client, room.roomId);
      await this.chatService.markMessagesAsDelivered(room.roomId, userId);

      const messages = await this.chatService.getRoomMessages(room.roomId, 50);

      this.broadcastToRoom(room.roomId, 'user_joined', { userId, roomId: room.roomId, timestamp: new Date() }, client.id);

      this.emitAck(client, 'room_joined', true, {
        roomId: room.roomId,
        room,
        messages: messages.reverse(),
      });
    } catch (error) {
      ConsoleKit.logKit(`Join room error: ${error.message}`);
      this.emitAck(client, 'room_joined', false, null, error.message);
    }
  }

  /**
   * Handle leaving a room
   */
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: JoinRoomDto): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) return;

      const { roomId } = payload;

      await this.leaveRoom(client, roomId);

      // Notify room about user leaving
      this.broadcastToRoom(
        roomId,
        'user_left',
        {
          userId,
          roomId,
          timestamp: new Date(),
        },
        client.id,
      );

      this.emitAck(client, 'room_left', true, { roomId });
    } catch (error) {
      ConsoleKit.errorKit(`Leave room error: ${error.message}`);
      this.emitAck(client, 'room_left', false, null, error.message);
    }
  }

  /**
   * Handle getting message history
   */
  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; limit?: number; before?: string },
  ): Promise<void> {
    populateAuthData(client);

    try {
      const { roomId, limit = 50, before } = payload;

      const messages = await this.chatService.getRoomMessages(roomId, limit, before ? new Date(before) : undefined);

      this.emitAck(client, 'messages_history', true, {
        roomId,
        messages: messages.reverse(),
        hasMore: messages.length === limit,
      });
    } catch (error) {
      ConsoleKit.errorKit(`Get messages error: ${error.message}`);
      this.emitAck(client, 'messages_history', false, null, error.message);
    }
  }

  /**
   * Handle client disconnect - notify rooms
   */
  protected async onClientDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.userId;
    if (!userId) return;

    // Notify all rooms this user was in
    client.roomIds?.forEach((roomId) => {
      this.broadcastToRoom(
        roomId,
        'user_offline',
        {
          userId,
          roomId,
          timestamp: new Date(),
        },
        client.id,
      );
    });
  }

  /**
   * When user fully disconnects (no more active sockets)
   */
  protected onUserFullyDisconnected(userId: string): void {
    ConsoleKit.logKit(`User ${userId} fully disconnected from all devices`);
  }
}
