// controllers/aiMessageController.ts
import { Request, Response } from 'express';
import mongoose, { Types, ClientSession } from 'mongoose';
import { AiMessage } from '../models/aiMessage';
import { AiSession } from '../models/aiSession';
import { supportsTransactions, trimLastMessage } from './helperController';
import { updateLastMessage } from './aiSessionController';

/**
 * Create a message AND update session.lastMessage atomically
 */
export const createMessage = async (req: Request, res: Response) => {
    const { sessionId, text, isUser } = req.body;

    if (!sessionId || typeof text !== 'string' || typeof isUser !== 'boolean') {
        return res.status(400).json({ error: 'sessionId, text and isUser are required' });
    }

    const canUseTransactions = await supportsTransactions();

    if (canUseTransactions) {
        const session: ClientSession = await mongoose.startSession();
        try {
            session.startTransaction();

            // ensure session exists
            const sessionDoc = await AiSession.findById(sessionId);
            if (!sessionDoc) return res.status(404).json({ error: 'Session not found' });

            const [messageDoc] = await AiMessage.create(
                [{ sessionId, text, isUser }],
                { session }
            );

            // Update session.lastMessage
            sessionDoc.lastMessage = trimLastMessage(text);
            await sessionDoc.save({ session });

            await session.commitTransaction();
            return res.status(201).json(messageDoc.toJSON());
        } catch (err) {
            await session.abortTransaction();
            process.env.DEBUG === 'true' && console.error('createMessage transaction error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            session.endSession();
        }
    }

    // fallback for standalone MongoDB
    try {

        // ensure session exists
        const sessionDoc = await AiSession.findById(sessionId);
        if (!sessionDoc) return res.status(404).json({ error: 'Session not found' });

        const messageDoc = await AiMessage.create({ sessionId, text, isUser });
        sessionDoc.lastMessage = trimLastMessage(text);
        await sessionDoc.save();
        return res.status(201).json(messageDoc.toJSON());
    } catch (err) {
        process.env.DEBUG === 'true' && console.error('createMessage standalone error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export async function createMessageFromServer(
    sessionId: string,
    text: string,
    isUser: boolean
) {
    if (!sessionId || typeof text !== 'string') {
        throw new Error('sessionId and text are required for createMessageFromServer');
    }

    const canUseTransactions = await supportsTransactions();

    if (canUseTransactions) {
        const session: ClientSession = await mongoose.startSession();
        try {
            session.startTransaction();

            // ✔ MUST load the sessionDoc within the transaction session
            const sessionDoc = await AiSession.findById(sessionId).session(session);
            if (!sessionDoc) throw new Error('Session not found');

            // ✔ Create message inside same transaction session
            const [messageDoc] = await AiMessage.create(
                [{ sessionId, text, isUser }],
                { session }
            );

            // ✔ Update parent session inside same transaction
            sessionDoc.lastMessage = trimLastMessage(text);
            await sessionDoc.save({ session });

            await session.commitTransaction();

            return messageDoc.toJSON ? messageDoc.toJSON() : messageDoc;

        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    // NO TRANSACTION fallback
    const sessionDoc = await AiSession.findById(sessionId);
    if (!sessionDoc) throw new Error('Session not found');

    const messageDoc = await AiMessage.create({ sessionId, text, isUser });

    sessionDoc.lastMessage = trimLastMessage(text);
    await sessionDoc.save();

    return messageDoc.toJSON ? messageDoc.toJSON() : messageDoc;
}


/**
 * Get single message
 */
export const getMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid message id' });

        const message = await AiMessage.findById(id).lean();
        if (!message) return res.status(404).json({ error: 'Message not found' });
        return res.json(message);
    } catch (err) {
        process.env.DEBUG === 'true' && console.error('getMessage error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get messages by session (supports pagination)
 */
export const getMessagesBySession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { limit = 100, skip = 0, sort = 'asc' } = req.query;

        if (!Types.ObjectId.isValid(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' });

        const sortDir = sort === 'desc' ? -1 : 1;

        const messages = await AiMessage.find({ sessionId })
            .sort({ createdAt: sortDir })
            .skip(Number(skip))
            .limit(Number(limit))
            .lean()
            .exec();

        return res.json(messages);
    } catch (err) {
        process.env.DEBUG === 'true' && console.error('getMessagesBySession error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update message AND session.lastMessage atomically
 */
export const updateMessage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { text, isUser } = req.body;

    if (!text && typeof isUser === 'undefined') {
        return res.status(400).json({ error: 'Nothing to update' });
    }

    const canUseTransactions = await supportsTransactions();

    if (canUseTransactions) {
        const mongoSession: ClientSession = await mongoose.startSession();
        try {
            mongoSession.startTransaction();

            const message = await AiMessage.findById(id).session(mongoSession);
            if (!message) {
                await mongoSession.abortTransaction();
                return res.status(404).json({ error: 'Message not found' });
            }

            if (text !== undefined) message.text = text;
            if (isUser !== undefined) message.isUser = isUser;

            await message.save({ session: mongoSession });
            await updateLastMessage(message.sessionId, mongoSession);

            await mongoSession.commitTransaction();
            return res.json(message.toJSON());
        } catch (err) {
            await mongoSession.abortTransaction();
            process.env.DEBUG === 'true' && console.error('updateMessage transaction error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            mongoSession.endSession();
        }
    } else {
        // Standalone fallback
        try {
            const message = await AiMessage.findById(id);
            if (!message) return res.status(404).json({ error: 'Message not found' });

            if (text !== undefined) message.text = text;
            if (isUser !== undefined) message.isUser = isUser;

            await message.save();
            await updateLastMessage(message.sessionId.toString());

            return res.json(message.toJSON());
        } catch (err) {
            process.env.DEBUG === 'true' && console.error('updateMessage standalone error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Delete message AND update session.lastMessage atomically
 */
export const deleteMessage = async (req: Request, res: Response) => {
    const { id } = req.params; // id can be a single id or comma-separated ids
    const ids = id.split(',').map(i => i.trim());
    const canUseTransactions = await supportsTransactions();

    if (canUseTransactions) {
        const mongoSession: ClientSession = await mongoose.startSession();
        try {
            mongoSession.startTransaction();

            // Find all messages by ids
            const messages = await AiMessage.find({ _id: { $in: ids } }).session(mongoSession);
            if (!messages.length) {
                await mongoSession.abortTransaction();
                return res.status(404).json({ error: 'No messages found' });
            }

            // Collect unique sessionIds to update last message
            const sessionIds = [...new Set(messages.map(m => m.sessionId.toString()))];

            // Delete all messages
            await AiMessage.deleteMany({ _id: { $in: ids } }).session(mongoSession);

            // Update last message for each affected session
            for (const sessionId of sessionIds) {
                await updateLastMessage(sessionId, mongoSession);
            }

            await mongoSession.commitTransaction();
            return res.json({ success: true });
        } catch (err) {
            await mongoSession.abortTransaction();
            process.env.DEBUG === 'true' && console.error('deleteMessage transaction error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            mongoSession.endSession();
        }
    } else {
        // Standalone fallback
        try {
            const messages = await AiMessage.find({ _id: { $in: ids } });
            if (!messages.length) return res.status(404).json({ error: 'No messages found' });

            const sessionIds = [...new Set(messages.map(m => m.sessionId.toString()))];

            await AiMessage.deleteMany({ _id: { $in: ids } });

            for (const sessionId of sessionIds) {
                await updateLastMessage(sessionId);
            }

            return res.json({ success: true });
        } catch (err) {
            process.env.DEBUG === 'true' && console.error('deleteMessage standalone error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteSessionWithMessages = async (
    sessionId: Types.ObjectId | string,
    mongoSession: ClientSession
) => {
    await AiMessage.deleteMany({ sessionId }, { session: mongoSession });
    await AiSession.findByIdAndDelete(sessionId, { session: mongoSession });
};