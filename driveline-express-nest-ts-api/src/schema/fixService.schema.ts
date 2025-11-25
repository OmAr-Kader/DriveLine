import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AvailabilityInterval } from './availabilityInterval.schema';
import { User } from './user.schema';

export type FixServiceDocument = HydratedDocument<FixService>;

@Schema({
  timestamps: true,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class FixService {
  @Prop({ type: Number, required: true })
  serviceAdminId: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, set: (v: string | Types.ObjectId) => new Types.ObjectId(v) })
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

  @Prop({ type: AvailabilityInterval, default: null })
  monday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  tuesday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  wednesday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  thursday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  friday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  saturday?: AvailabilityInterval;

  @Prop({ type: AvailabilityInterval, default: null })
  sunday?: AvailabilityInterval;
}

export const FixServiceSchema = SchemaFactory.createForClass(FixService);
