// models/course.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { AvailabilityInterval, AvailabilityIntervalSchema } from '../models/helper';

export interface ICourse extends Document {
    courseAdminId: number;
    techId: Types.ObjectId;

    description?: string;
    price: string;
    currency?: string;
    sessions: number;
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

const CourseSchema = new Schema<ICourse>(
    {
        courseAdminId: { type: Number, required: true, index: true },
        techId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        description: { type: String, default: '' },
        price: { type: String, required: true },
        currency: { type: String, default: 'USD' },
        sessions: { type: Number, required: true, default: 2 },

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
CourseSchema.index({ courseAdminId: 1, isActive: 1 });
CourseSchema.index({ techId: 1, isActive: 1 });

export const CourseModel = mongoose.model<ICourse>('Course', CourseSchema);
export default CourseModel;