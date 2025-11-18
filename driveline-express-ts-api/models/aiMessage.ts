// models/AiMessage.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAiMessage extends Document {
    sessionId: Types.ObjectId; // must be ObjectId type
    text: string;
    isUser: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const AiMessageSchema = new Schema<IAiMessage>(
    {
        // ✅ Correct type assignment for ObjectId references in TypeScript
        sessionId: { type: Schema.Types.ObjectId, ref: 'AiSession', required: true, index: true },
        text: { type: String, required: true },
        isUser: { type: Boolean, required: true },
    },
    {
        timestamps: true
    }
);

export const AiMessage = model<IAiMessage>('AiMessage', AiMessageSchema);