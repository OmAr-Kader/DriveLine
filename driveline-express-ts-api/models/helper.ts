import { Schema } from 'mongoose';

export interface AvailabilityInterval {
    startUTC: number;
    endUTC: number;
}

export const AvailabilityIntervalSchema = new Schema<AvailabilityInterval>(
  {
        startUTC: { type: Number, required: true },
        endUTC: { type: Number, required: true },
  },
  { _id: false }
);
