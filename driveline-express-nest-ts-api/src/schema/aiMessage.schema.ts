import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AiSession } from './aiSession.schema';

@Schema({
  timestamps: true,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class AiMessage extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: AiSession.name, index: true, set: (v: string | Types.ObjectId) => new Types.ObjectId(v) })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isUser: boolean;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);
