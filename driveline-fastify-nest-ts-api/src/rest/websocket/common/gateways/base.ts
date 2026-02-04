/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket, populateAuthData } from '../interfaces/socket.interface';
import { ConsoleKit } from 'src/common/utils/LogKit';

/**
 * Base Gateway class providing common WebSocket functionality
 * All socket gateways should extend this class
 *
 * Features:
 * - Connection/disconnection lifecycle hooks
 * - User tracking with Map for O(1) lookups
 * - Room management utilities
 * - Broadcast helpers for efficient message delivery
 * - Error handling and logging
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure based on your needs
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
export abstract class BaseGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  protected server: Server;

  protected readonly logTag: string;

  // Track connected users: Map<userId, Set<socketId>>
  // Supports multiple connections per user (multiple devices)
  protected connectedUsers: Map<string, Set<string>> = new Map();

  // Track socket to user mapping for quick lookups
  protected socketToUser: Map<string, string> = new Map();

  constructor(logTag: string) {
    this.logTag = logTag;
  }

  afterInit(server: Server): void {
    ConsoleKit.logKit(`${this.logTag} initialized`);
    this.onServerInit(server);
  }

  handleConnection(client: AuthenticatedSocket): void {
    ConsoleKit.logKit(`${this.logTag} Client attempting connection: ${client.id}`);
    //client.roomIds = new Set();
    populateAuthData(client);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    populateAuthData(client);
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
          this.onUserFullyDisconnected(userId, client);
        }
      }
      this.socketToUser.delete(client.id);
    }

    await this.onClientDisconnect(client);
    ConsoleKit.logKit(`${this.logTag} Client disconnected: ${client.id}`);
  }

  // Override in child classes for custom initialization
  protected onServerInit(server: Server): void {}

  // Override in child classes for custom disconnect handling
  protected async onClientDisconnect(client: AuthenticatedSocket): Promise<void> {}

  // Called when user has no more active connections
  protected onUserFullyDisconnected(userId: string, lastSocket: AuthenticatedSocket): void {}

  /**
   * Register a user's socket connection
   */
  protected registerUser(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
    this.socketToUser.set(socketId, userId);
  }

  /**
   * Join a socket to a room and track it
   */
  protected async joinRoom(client: Socket, roomId: string, roomIds?: Set<string>): Promise<void> {
    await client.join(roomId);
    roomIds?.add(roomId);
  }

  /**
   * Leave a room and clean up tracking
   */
  protected async leaveRoom(client: Socket, roomId: string, roomIds?: Set<string>): Promise<void> {
    await client.leave(roomId);
    roomIds?.delete(roomId);
  }

  /**
   * Broadcast to all sockets in a room except sender
   */
  protected broadcastToRoom(roomId: string, event: string, data: any, excludeSocketId: string): void {
    if (excludeSocketId) {
      this.server.to(roomId).except(excludeSocketId).emit(event, data);
    } else {
      this.server.to(roomId).emit(event, data);
    }
  }

  /**
   * Send to specific user across all their connected devices
   */
  protected sendToUser(userId: string, event: string, data: any): void {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Check if a user is currently connected
   */
  protected isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && (this.connectedUsers.get(userId)?.size ?? 0) > 0;
  }

  /**
   * Get count of users in a room
   */
  protected async getRoomUserCount(roomId: string): Promise<number> {
    const sockets = await this.server.in(roomId).fetchSockets();
    return sockets.length;
  }

  /**
   * Emit acknowledgment to client
   */
  protected emitAck(client: Socket, event: string, success: boolean, data?: any, error?: string): void {
    client.emit(event, {
      success,
      data,
      error,
      timestamp: new Date(),
    });
  }
}
