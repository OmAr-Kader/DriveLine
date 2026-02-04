import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Default__v, HydratedDocument, Require_id, Types } from 'mongoose';
import { User } from './user.schema';
import { MongoMetaObject } from '../types/mongoose-extensions';
//import { baseTransform } from './helper';

export type ShortVideoDocument = HydratedDocument<ShortVideo>;

/*@Schema({
  timestamps: true,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: true, minimize: true, transform: baseTransform },
  toJSON: { getters: true, minimize: true, transform: baseTransform },
})*/
@Schema({
  timestamps: true,
  versionKey: false,
  id: true,
  toObject: {
    getters: true,
    versionKey: false,
    virtuals: true,
    aliases: false,
    flattenObjectIds: true,
    schemaFieldsOnly: true,
    transform: (
      doc: HydratedDocument<ShortVideo> & { createdAt: Date; updatedAt: Date },
      ret: Default__v<Require_id<ShortVideo>> & { createdAt?: string; updatedAt?: string },
    ) => {
      const created = doc?.createdAt ?? ret?.createdAt;
      const updated = doc?.updatedAt ?? ret?.updatedAt;
      ret.createdAt = created.toISOString();
      ret.updatedAt = updated.toISOString();
      return ret;
    },
  },
  toJSON: { getters: true },
})
export class ShortVideo extends MongoMetaObject {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    set: (v: string | Types.ObjectId) => (typeof v === 'string' ? new Types.ObjectId(v) : v),
  })
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

ShortVideoSchema.index({ createdAt: -1 }); // For sorting
ShortVideoSchema.index({ userId: 1, createdAt: -1 }); // For user-specific queries
