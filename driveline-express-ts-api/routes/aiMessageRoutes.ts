// routes/aiMessageRoutes.ts
import { Router } from 'express';
import {
    createMessage,
    getMessage,
    getMessagesBySession,
    updateMessage,
    deleteMessage,
} from '../controllers/aiMessageController';
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = Router();

/**
 * Note: mount this in your app like: app.use('/api', aiMessageRouter)
 *
 * POST   /messages              -> create message
 * GET    /messages/:id          -> get single message
 * PUT    /messages/:id          -> update message
 * DELETE /messages/:id          -> delete message
 *
 * GET    /sessions/:sessionId/messages  -> list messages for a session (query: limit, skip, sort=asc|desc)
 */
router.post('/messages', verifyJWTtoken, verifyApiKey, createMessage);
router.get('/messages/:id', verifyJWTtoken, verifyApiKey, getMessage);
router.put('/messages/:id', verifyJWTtoken, verifyApiKey, updateMessage);
router.delete('/messages/:id', verifyJWTtoken, verifyApiKey, deleteMessage);

router.get('/sessions/:sessionId/messages', verifyJWTtoken, getMessagesBySession);

export default router;
