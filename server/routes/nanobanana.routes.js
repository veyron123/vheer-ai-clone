import express from 'express';
import { generateImage, generateFromPrompt } from '../controllers/nanobanana.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image with Nano-Banana (image-to-image transformation)
router.post('/image-to-image', authenticate, generateImage);

// Generate image from prompt with Nano-Banana (text-to-image)
router.post('/generate', authenticate, generateFromPrompt);

export default router;