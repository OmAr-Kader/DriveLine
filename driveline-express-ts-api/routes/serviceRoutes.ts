import { Router } from "express";
import { GeminiController } from "../controllers/geminiController";
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = Router();

router.post("/gemini", verifyJWTtoken, verifyApiKey, GeminiController.generate);

export default router;