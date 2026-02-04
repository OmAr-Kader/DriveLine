import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseTransform } from 'src/common/schema/helper';

export type MessageDocument = Message & Document;

@Schema({
  timestamps: true,
  collection: 'messages',

  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: true, minimize: true, transform: baseTransform },
  toJSON: { getters: true, minimize: true, transform: baseTransform },
})
export class Message {
  @Prop({ required: true, index: true })
  roomId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: ['text', 'image', 'file'], default: 'text' })
  type: 'text' | 'image' | 'file';

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [] })
  readBy: string[];

  @Prop({ type: [String], default: [] })
  deliveredTo: string[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  editedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
