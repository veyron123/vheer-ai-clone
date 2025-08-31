import express from 'express';
import { generateImageToImage, generateImage } from '../controllers/midjourney.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image-to-image with Midjourney (requires authentication for credit tracking)
router.post('/image-to-image', authenticate, generateImageToImage);

// Generate text-to-image with Midjourney (requires authentication for credit tracking)
router.post('/text-to-image', authenticate, generateImage);

export default router;