/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { BadGatewayException, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import { populateAuthData, type AuthenticatedSocket } from '../common/interfaces/socket.interface';
import { BaseGateway } from '../common/gateways/base';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { ConsoleKit } from 'src/common/utils/LogKit';
import { WsThrottle } from 'src/rest/flow-control/decorators/priority.decorator';
import { WsThrottleGuard } from 'src/rest/flow-control/guards/rate-limit.guard';

/**
 * -> SEND EVENTS:
 * 1- { "subscribe", data: { userId, rooms[], timestamp } }
 * 2- { "get_rooms", data: { rooms[], hasMore, offset } }
 * 3- { "toggle_pin", data: { roomId, isPinned } }
 * 4- { "toggle_mute", data: { roomId, isMuted } }
 *
 * -> RECEIVE EVENTS:
 * 1- { "subscribed", data: { userId } }
 * 2- { "rooms_list", data: { limit?, offset? } }
 * 3- { "pin_toggled", data: { roomId } }
 * 4- { "mute_toggled", data: { roomId } }
 * 5- { "room_list_update", data: { roomSummary } }  // Push from server when room list changes
 *
 * Rooms Gateway - Handles room list updates and last message sync
 * Provides real-time room list updates for chat overview screens
 */
@WsThrottle(100, 10000) // 100 messages per 10 seconds max
@UseGuards(JwtAuthGuard, WsThrottleGuard)
@WebSocketGateway({
  namespace: '/rooms',
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
export class RoomsGateway extends BaseGateway {
  @WebSocketServer()
  declare server: Server;

  constructor(private readonly roomsService: RoomsService) {
    super('RoomsGateway');
  }

  protected onServerInit(server: Server): void {
    // Pass server reference to service for broadcasting
    this.roomsService.setServer(server);
  }

  /**
   * Subscribe to room list updates
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: { userId: string }): Promise<void> {
    populateAuthData(client);

    try {
      const { userId } = payload;

      // Register user and join their personal room for targeted updates
      client.userId = userId;
      this.registerUser(userId, client.id);
      await client.join(`user:${userId}`);

      // Get initial room list with summaries
      const rooms = await this.roomsService.getUserRoomsWithSummary(userId);

      this.emitAck(client, 'subscribed', true, {
        userId,
        rooms,
        timestamp: new Date(),
      });

      ConsoleKit.logKit(`${this.logTag} User ${userId} subscribed to room updates`);
    } catch (error: any) {
      ConsoleKit.errorKit(`${this.logTag} Subscribe error: ${error.message}`);
      this.emitAck(client, 'subscribed', false, null, error.message);
    }
  }

  /**
   * Get room list on demand
   */
  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: { limit?: number; offset?: number }): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) {
        throw new BadGatewayException('User not subscribed');
      }

      const { limit = 50, offset = 0 } = payload;
      const rooms = await this.roomsService.getUserRoomsWithSummary(userId, limit, offset);

      this.emitAck(client, 'rooms_list', true, {
        rooms,
        hasMore: rooms.length === limit,
        offset: offset + rooms.length,
      });
    } catch (error) {
      ConsoleKit.errorKit(`${this.logTag} Get rooms error: ${error.message}`);
      this.emitAck(client, 'rooms_list', false, null, error.message);
    }
  }

  /**
   * Toggle pin status for a room
   */
  @SubscribeMessage('toggle_pin')
  async handleTogglePin(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: { roomId: string }): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) throw new BadGatewayException('User not subscribed');

      const isPinned = await this.roomsService.togglePinRoom(payload.roomId, userId);

      this.emitAck(client, 'pin_toggled', true, {
        roomId: payload.roomId,
        isPinned,
      });
    } catch (error: any) {
      ConsoleKit.errorKit(`${this.logTag} Toggle pin error: ${error.message}`);
      this.emitAck(client, 'pin_toggled', false, null, error.message);
    }
  }

  /**
   * Toggle mute status for a room
   */
  @SubscribeMessage('toggle_mute')
  async handleToggleMute(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: { roomId: string }): Promise<void> {
    populateAuthData(client);

    try {
      const userId = client.userId;
      if (!userId) throw new BadGatewayException('User not subscribed');

      const isMuted = await this.roomsService.toggleMuteRoom(payload.roomId, userId);

      this.emitAck(client, 'mute_toggled', true, {
        roomId: payload.roomId,
        isMuted,
      });
    } catch (error) {
      ConsoleKit.errorKit(`${this.logTag} Toggle mute error: ${error.message}`);
      this.emitAck(client, 'mute_toggled', false, null, error.message);
    }
  }

  protected async onClientDisconnect(client: AuthenticatedSocket): Promise<void> {
    populateAuthData(client);

    const userId = client.userId;
    if (userId) {
      await client.leave(`user:${userId}`);
      ConsoleKit.logKit(`${this.logTag} User ${userId} unsubscribed from room updates`);
    }
  }
}
