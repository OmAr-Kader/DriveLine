// models/shortVideo.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IShortVideo extends Document {
    userId: Types.ObjectId;
    title: string;
    link: string;
    thumbImageName?: string;
    tags: number[];

    views?: number;

    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema = new Schema<IShortVideo>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        link: { type: String, required: true },
        thumbImageName: { type: String, required: true },
        tags: { type: [Number], default: [] },

        views: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export const ShortVideModel = mongoose.model<IShortVideo>('ShortVideo', ServiceSchema);
export default ShortVideModel;