import { Request, Response } from "express";
import { GeminiService } from "../services/gemini";
import { GeminiError } from "../models/gemini";
import { createMessageFromServer } from "../controllers/aiMessageController";

export class GeminiController {

    static async generate(req: Request, res: Response) {
        try {
            const { sessionId, text, saveQuestion } = req.body as { sessionId?: string; text?: string ; saveQuestion?: boolean };

            if (!text || typeof text !== 'string') {
                return res.status(400).json({ error: 'text is required' });
            }

            // If sessionId provided, save user message first
            if (sessionId && saveQuestion) {
                try {
                    await createMessageFromServer(sessionId, text, true);
                } catch (err) {
                    process.env.DEBUG === 'true' && console.error('Failed saving user message (continuing):', err);
                }
            }

            // Call Gemini
            const answerText = await GeminiService.generateContent(text);

            // If sessionId provided, save the answer as server message
            let answerMessageSaved: any = null;
            if (sessionId) {
                try {
                    answerMessageSaved = await createMessageFromServer(sessionId, answerText, false);
                } catch (err) {
                    process.env.DEBUG === 'true' && console.error('Failed saving answer message:', err);
                }   
            }

            // Build response payload
            const createdAt = answerMessageSaved?.createdAt ? answerMessageSaved.createdAt : new Date().toISOString();

            return res.status(200).json(answerMessageSaved || {
                text: answerText,
                isUser: false,
                createdAt
            });
        } catch (err: any) {
            process.env.DEBUG === 'true' && console.error('Gemini generate error:', err);
            if (err instanceof GeminiError && err.status) {
                return res.status(err.status).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    };
}