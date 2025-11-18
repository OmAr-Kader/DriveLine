// routes/aiSessionRoutes.ts
import { Router } from "express";
import {
    createSessionAndAddFirstMessage,
    createSession,
    listSessions,
    updateSessionTitle,
    deleteSession,
} from "../controllers/aiSessionController";
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = Router();

/**
 * POST   /sessions               -> create new session
 * GET    /sessions               -> list all sessions
 * PUT    /sessions/:id           -> update session title
 * DELETE /sessions/:id           -> delete session (+ its messages)
 */
router.post("/sessions/with-first-message", verifyJWTtoken, verifyApiKey, createSessionAndAddFirstMessage);
router.post("/sessions", verifyJWTtoken, verifyApiKey, createSession);
router.get("/sessions", verifyJWTtoken, verifyApiKey, listSessions);
router.put("/sessions/:id", verifyJWTtoken, verifyApiKey, updateSessionTitle);
router.delete("/sessions/:id", verifyJWTtoken, verifyApiKey, deleteSession);

export default router;