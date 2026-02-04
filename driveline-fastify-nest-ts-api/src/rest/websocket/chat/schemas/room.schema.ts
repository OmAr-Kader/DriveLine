import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseTransform } from 'src/common/schema/helper';

export type RoomDocument = Room & Document;

@Schema({
  timestamps: true,
  collection: 'rooms',

  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: true, minimize: true, transform: baseTransform },
  toJSON: { getters: true, minimize: true, transform: baseTransform },
})
export class Room {
  @Prop({ required: true, index: true, unique: true })
  roomId: string;

  @Prop({ type: [String], required: true, index: true })
  userIds: string[];

  @Prop({ type: String, default: null })
  name?: string;

  @Prop({ type: String, enum: ['direct', 'group'], default: 'direct' })
  type: 'direct' | 'group';

  @Prop({ type: Object, default: null })
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
    type: string;
  };

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now, index: true })
  lastActivityAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
