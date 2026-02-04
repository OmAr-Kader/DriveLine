import { Socket } from 'socket.io';
import { Const } from 'src/common/utils/Const';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  roomIds?: Set<string>;
}

export interface ConnectPayload {
  userId: string;
  roomId?: string;
}

export interface MessagePayload {
  roomId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

export interface RoomEvent {
  roomId: string;
  userId: string;
  timestamp: Date;
}

export interface TypingPayload {
  roomId: string;
  isTyping: boolean;
}

export interface LastMessageUpdate {
  roomId: string;
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: Date;
    type: string;
  };
  unreadCount?: number;
}

export function populateAuthData(auth: AuthenticatedSocket) {
  // Already set?
  if (!auth.userId) {
    auth.userId = ((auth.handshake.headers[Const.UserID] as string) || (auth.handshake.query[Const.UserID] as string)) ?? '';
  }

  if (!auth.roomIds) {
    const roomIdsStr = (auth.handshake.headers['roomIds'] as string) || (auth.handshake.query['roomIds'] as string);
    auth.roomIds = new Set(parseRoomIds(roomIdsStr));
  }
}

function parseRoomIds(roomIdsStr: string | undefined): string[] {
  if (!roomIdsStr) return [];
  return roomIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}
