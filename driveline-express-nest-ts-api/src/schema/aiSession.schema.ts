import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema({
  timestamps: true,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class AiSession extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name, index: true, set: (v: string | Types.ObjectId) => new Types.ObjectId(v) })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  lastMessage: string;
}

export const AiSessionSchema = SchemaFactory.createForClass(AiSession);
