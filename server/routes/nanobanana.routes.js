import express from 'express';
import { generateImage, generateFromPrompt } from '../controllers/nanobanana.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image with Nano-Banana (requires authentication for credit tracking)
router.post('/generate', authenticate, generateImage);

// Generate image from prompt with Nano-Banana (requires authentication for credit tracking)
router.post('/generate-from-prompt', authenticate, generateFromPrompt);

export default router;