// routes/shortVideoRoutes.ts
import express from 'express';
import {
    createShortVideo,
    getShortVideosByUserId,
    getShortVideoById,
    fetchVideosByTag,
    fetchLast50Videos,
    updateShortVideoTags,
    increaseViews,
    deleteVideo,
} from '../controllers/shortVideoController';
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = express.Router();

// Create
router.post('/shorts', verifyJWTtoken, verifyApiKey, createShortVideo);

// Partial update
router.patch('/shorts/:id/tags', verifyJWTtoken, verifyApiKey, updateShortVideoTags);

// Partial update
router.post('/shorts/:id/views/increment', verifyJWTtoken, verifyApiKey, increaseViews);

// Get paginated short videos for a user
router.get('/user/:userId/shorts', verifyJWTtoken, verifyApiKey, getShortVideosByUserId);

// Get a single short video by id
router.get('/shorts/:id', verifyJWTtoken, verifyApiKey, getShortVideoById);

// Fetch last 50 uploaded short videos across all users
router.get('/latest/shorts', verifyJWTtoken, verifyApiKey, fetchLast50Videos);

// Get videos filtered by tag
router.get('/tags/:tag/shorts', verifyJWTtoken, verifyApiKey, fetchVideosByTag);

// Delete a short video
router.delete('/shorts/:id', verifyJWTtoken, verifyApiKey, deleteVideo);

export default router;