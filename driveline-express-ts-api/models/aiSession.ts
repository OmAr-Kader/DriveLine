// models/AiSession.ts
import { Schema, model, Document } from 'mongoose';

export interface IAiSession extends Document {
    userId: string;
    title: string;
    lastMessage: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const AiSessionSchema = new Schema<IAiSession>(
    {
        userId: { type: String, required: true },
        title: { type: String, required: true },
        lastMessage: { type: String, default: '' },
    },
    {
        timestamps: true
    }
);

export const AiSession = model<IAiSession>('AiSession', AiSessionSchema);
