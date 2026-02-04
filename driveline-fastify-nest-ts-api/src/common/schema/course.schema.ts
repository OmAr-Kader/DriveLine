import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Default__v, HydratedDocument, Require_id, Types } from 'mongoose';
import { AvailabilityInterval } from './availabilityInterval.schema';
import { User } from './user.schema';
import { MongoMeta, MongoMetaObject } from '../types/mongoose-extensions';
//import { baseTransform } from './helper';

export type CourseDocument = HydratedDocument<Course> & MongoMeta;

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
      doc: HydratedDocument<Course> & { createdAt: Date; updatedAt: Date },
      ret: Default__v<Require_id<Course>> & { createdAt?: string; updatedAt?: string },
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
export class Course extends MongoMetaObject {
  @Prop({ type: Number, required: true })
  courseAdminId: number;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
    set: (v: string | Types.ObjectId) => (typeof v === 'string' ? new Types.ObjectId(v) : v),
  })
  techId: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: string;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop()
  sessions: number;

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

export const CourseSchema = SchemaFactory.createForClass(Course);
