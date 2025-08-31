import express from 'express';
import { generateImage, generateImageToImage } from '../controllers/gptimage.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image with GPT IMAGE (requires authentication for credit tracking)
router.post('/generate', authenticate, generateImage);

// Generate image-to-image with GPT IMAGE (requires authentication for credit tracking)
router.post('/image-to-image', authenticate, generateImageToImage);

export default router;