import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseTransform } from 'src/common/schema/helper';

export type RoomSummaryDocument = RoomSummary & Document;

/**
 * Stores per-user room summary data (unread counts, etc.)
 * Separate from Room schema for efficient querying
 */
@Schema({
  timestamps: true,
  collection: 'room_summaries',

  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: true, minimize: true, transform: baseTransform },
  toJSON: { getters: true, minimize: true, transform: baseTransform },
})
export class RoomSummary {
  @Prop({ required: true, index: true, unique: true })
  roomId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  @Prop({ type: Boolean, default: false })
  isMuted: boolean;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: Date, default: null })
  lastReadAt?: Date;

  @Prop({ type: Object, default: null })
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
    type: string;
  };
}

export const RoomSummarySchema = SchemaFactory.createForClass(RoomSummary);
