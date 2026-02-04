import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Default__v, Document, HydratedDocument, Require_id, Types } from 'mongoose';
import { AiSession } from './aiSession.schema';
import { MongoMeta, MongoMetaObject } from '../types/mongoose-extensions';

export type AiMessageDocument = HydratedDocument<AiMessage> & MongoMeta;

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
      doc: HydratedDocument<AiMessage> & { createdAt: Date; updatedAt: Date },
      ret: Default__v<Require_id<AiMessage>> & { createdAt?: string; updatedAt?: string },
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
export class AiMessage extends MongoMetaObject {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: AiSession.name,
    index: true,
    set: (v: string | Types.ObjectId) => (typeof v === 'string' ? new Types.ObjectId(v) : v),
  })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isUser: boolean;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);
