// models/Service.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { AvailabilityInterval, AvailabilityIntervalSchema } from '../models/helper';

export interface IService extends Document {
    serviceAdminId: number;          // logical service type id (e.g. 'cleaning-basic')
    techId: Types.ObjectId;

    description?: string;
    price: string;
    currency?: string;
    durationMinutes?: number;
    isActive: boolean;
    images: string[];

    monday?: AvailabilityInterval;
    tuesday?: AvailabilityInterval;
    wednesday?: AvailabilityInterval;
    thursday?: AvailabilityInterval;
    friday?: AvailabilityInterval;
    saturday?: AvailabilityInterval;
    sunday?: AvailabilityInterval;

    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
    {
        serviceAdminId: { type: Number, required: true, index: true },
        techId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        description: { type: String, default: '' },
        price: { type: String, required: true },
        currency: { type: String, default: 'USD' },
        durationMinutes: { type: Number, default: 60 },

        isActive: { type: Boolean, default: true },
        images: { type: [String], default: [], required: false },
        monday: { type: AvailabilityIntervalSchema, required: false },
        tuesday: { type: AvailabilityIntervalSchema, required: false },
        wednesday: { type: AvailabilityIntervalSchema, required: false },
        thursday: { type: AvailabilityIntervalSchema, required: false },
        friday: { type: AvailabilityIntervalSchema, required: false },
        saturday: { type: AvailabilityIntervalSchema, required: false },
        sunday: { type: AvailabilityIntervalSchema, required: false },
    },
    { timestamps: true }
);

// performance indexes
ServiceSchema.index({ serviceAdminId: 1, isActive: 1 });
ServiceSchema.index({ techId: 1, isActive: 1 });

export const ServiceModel = mongoose.model<IService>('Service', ServiceSchema);
export default ServiceModel;