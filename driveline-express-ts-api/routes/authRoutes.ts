import express from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { verifyApiKey } from '../utils/verification';

const router = express.Router();

// ✅ Apply API key protection to both endpoints
router.post('/register', verifyApiKey, registerUser);
router.post('/login', verifyApiKey, loginUser);

export default router;