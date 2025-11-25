import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type ShortVideoDocument = HydratedDocument<ShortVideo>;

@Schema({
  timestamps: true,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class ShortVideo {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true, set: (v: string | Types.ObjectId) => new Types.ObjectId(v) })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop({ required: true })
  thumbImageName: string;

  @Prop({ type: [Number], default: [] })
  tags: number[];

  @Prop({ default: 0 })
  views: number;
}

export const ShortVideoSchema = SchemaFactory.createForClass(ShortVideo);
