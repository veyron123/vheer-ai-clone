import express from 'express';
import { generateImage, generateImageWithoutInput } from '../controllers/gptimage.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image with GPT IMAGE (requires authentication for credit tracking)
router.post('/generate', authenticate, generateImage);

// Generate image-to-image (alias for generate)
router.post('/image-to-image', authenticate, generateImage);

// Generate image without input (requires authentication for credit tracking)
router.post('/generate-without-input', authenticate, generateImageWithoutInput);

export default router;