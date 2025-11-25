import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
  timestamps: false,
  versionKey: false,
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class AvailabilityInterval {
  @Prop({ required: true })
  startUTC: number; // e.g. '09:00'

  @Prop({ required: true })
  endUTC: number; // e.g. '17:00'
}

export const AvailabilityIntervalSchema = SchemaFactory.createForClass(AvailabilityInterval);
