import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Default__v, HydratedDocument, Require_id, Types } from 'mongoose';
import { AvailabilityInterval } from './availabilityInterval.schema';
import { User } from './user.schema';
import { MongoMeta, MongoMetaObject } from '../types/mongoose-extensions';
//import { baseTransform } from './helper';

export type FixServiceDocument = HydratedDocument<FixService> & MongoMeta;

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
      doc: HydratedDocument<FixService> & { createdAt: Date; updatedAt: Date },
      ret: Default__v<Require_id<FixService>> & { createdAt?: string; updatedAt?: string },
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
export class FixService extends MongoMetaObject {
  @Prop({ type: Number, required: true })
  serviceAdminId: number;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
    set: (v: string | Types.ObjectId) => (typeof v === 'string' ? new Types.ObjectId(v) : v),
    //get: (v: Types.ObjectId): string => v.toHexString(),
  })
  techId: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: string;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop()
  durationMinutes?: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  monday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  tuesday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  wednesday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  thursday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  friday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  saturday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, required: true, default: { dayOff: true } })
  sunday?: AvailabilityInterval;
}

export const FixServiceSchema = SchemaFactory.createForClass(FixService);
