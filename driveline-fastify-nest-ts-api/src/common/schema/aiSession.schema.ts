import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Default__v, Document, HydratedDocument, Require_id, Types } from 'mongoose';
import { User } from './user.schema';
import { MongoMeta, MongoMetaObject } from '../types/mongoose-extensions';
//import { baseTransform } from './helper';

export type AiSessionDocument = HydratedDocument<AiSession> & MongoMeta;

@Schema({
  timestamps: true,
  versionKey: false,
  id: true,
  toObject: {
    getters: true,
    versionKey: false,
    //virtuals: true,
    aliases: false,
    flattenObjectIds: true,
    schemaFieldsOnly: true,
    transform: (
      doc: HydratedDocument<AiSession> & { createdAt: Date; updatedAt: Date },
      ret: Default__v<Require_id<AiSession>> & { createdAt?: string; updatedAt?: string },
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
export class AiSession extends MongoMetaObject {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: User.name,
    index: true,
    set: (v: string | Types.ObjectId) => (typeof v === 'string' ? (Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : v) : v),
    //get: (v: Types.ObjectId) => v.toHexString(),
  })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  lastMessage: string;
}

export const AiSessionSchema = SchemaFactory.createForClass(AiSession);
