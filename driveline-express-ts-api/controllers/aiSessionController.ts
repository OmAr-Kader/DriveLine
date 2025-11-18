// controllers/aiSessionController.ts
import { Request, Response } from "express";
import mongoose, { ClientSession, Types } from "mongoose";
import { AiSession } from "../models/aiSession";
import { AiMessage } from "../models/aiMessage";
import { supportsTransactions, trimLastMessage } from './helperController';
import { deleteSessionWithMessages } from '../controllers/aiMessageController';

/**
 * Utility: validate string field
 */
const validateString = (value: any, name: string): string | null => {
    if (!value || typeof value !== "string") return `${name} is required and must be string`;
    return null;
};


/**
 * Create a session and add the first message
 * - Works with replica sets (transactions) and standalone MongoDB
 */
export const createSessionAndAddFirstMessage = async (req: Request, res: Response) => {
    const { title, text, isUser } = req.body;
    const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined;

    // --- Validation ---
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title is required" });
    }
    if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "text is required" });
    }
    if (typeof isUser !== "boolean") {
        return res.status(400).json({ error: "isUser must be boolean" });
    }
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const canUseTransactions = await supportsTransactions();

    // --- Replica set path with transaction ---
    if (canUseTransactions) {
        const session: ClientSession = await mongoose.startSession();
        try {
            session.startTransaction();

            // Step 1: Create session
            const [sessionDoc] = await AiSession.create([{ userId, title, lastMessage: "" }], { session });

            // Step 2: Create first message
            const [messageDoc] = await AiMessage.create(
                [{ sessionId: sessionDoc._id, text, isUser }],
                { session }
            );

            // Step 3: Update lastMessage via session
            sessionDoc.lastMessage = trimLastMessage(text);
            await sessionDoc.save({ session });

            await session.commitTransaction();
            return res.status(201).json({
                session: sessionDoc.toJSON(),
                message: messageDoc.toJSON(),
            });
        } catch (err) {
            await session.abortTransaction();
            process.env.DEBUG === 'true' && console.error("createSessionAndAddFirstMessage error (transaction):", err);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            session.endSession();
        }
    }

    // --- Standalone MongoDB path (no transaction) ---
    try {
        const sessionDoc = await AiSession.create({ userId, title, lastMessage: "" });
        const messageDoc = await AiMessage.create({ sessionId: sessionDoc._id, text, isUser });

        sessionDoc.lastMessage = trimLastMessage(text);
        await sessionDoc.save();

        return res.status(201).json({
            session: sessionDoc.toJSON(),
            message: messageDoc.toJSON(),
        });
    } catch (err) {
        process.env.DEBUG === 'true' && console.error("createSessionAndAddFirstMessage error (standalone):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create session only
 * Body: { title: string }
 */
export const createSession = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined;

        const titleErr = validateString(title, "title");
        if (titleErr) return res.status(400).json({ error: titleErr });
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const session = await new AiSession({ userId, title }).save();
        return res.status(201).json(session.toJSON());
    } catch (err) {
        process.env.DEBUG === 'true' && console.error("createSession error", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * List all sessions
 * GET /sessions?limit=20&skip=0
 * Optional pagination for performance
 */
export const listSessions = async (req: Request, res: Response) => {
    try {
        const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined;

        const limit = parseInt((req.query.limit as string) || "50", 10);
        const skip = parseInt((req.query.skip as string) || "0", 10);
        if (!userId) {
            res.status(401).json({ message: 'Missing userId' });
            return;
        }

        // Using lean() for performance (lighter objects)
        const sessions = await AiSession.find({ userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        return res.json(sessions);
    } catch (err) {
        process.env.DEBUG === 'true' && console.error("listSessions error", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update session title only
 * PUT /sessions/:id { title }
 */
export const updateSessionTitle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const titleErr = validateString(title, "title");
        if (titleErr) return res.status(400).json({ error: titleErr });

        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid session id" });

        const updated = await AiSession.findByIdAndUpdate(
            id,
            { title },
            { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ error: "Session not found" });
        return res.json(updated);
    } catch (err) {
        process.env.DEBUG === 'true' && console.error("updateSessionTitle error", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};


export const updateLastMessage = async (
    sessionId: Types.ObjectId | string,
    session?: ClientSession
) => {
    const latest = await AiMessage.findOne({ sessionId })
        .sort({ createdAt: -1 })
        .lean();

    const lastMessage: String = trimLastMessage(latest?.text || '');
    await AiSession.findByIdAndUpdate(sessionId, { lastMessage }, { session });
};

/**
 * Delete session + all messages atomically
 * DELETE /sessions/:id
 */
export const deleteSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const canUseTransactions = await supportsTransactions();

    if (canUseTransactions) {
        const mongoSession: ClientSession = await mongoose.startSession();
        try {
            mongoSession.startTransaction();

            const session = await AiSession.findById(id).session(mongoSession);
            if (!session) {
                await mongoSession.abortTransaction();
                return res.status(404).json({ error: 'Session not found' });
            }

            await deleteSessionWithMessages(id, mongoSession);

            await mongoSession.commitTransaction();
            return res.json({ success: true });
        } catch (err) {
            await mongoSession.abortTransaction();
            process.env.DEBUG === 'true' && console.error('deleteSession transaction error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            mongoSession.endSession();
        }
    } else {
        // Standalone fallback
        try {
            const session = await AiSession.findById(id);
            if (!session) return res.status(404).json({ error: 'Session not found' });

            await AiMessage.deleteMany({ sessionId: id });
            await AiSession.findByIdAndDelete(id);

            return res.json({ success: true });
        } catch (err) {
            process.env.DEBUG === 'true' && console.error('deleteSession standalone error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};