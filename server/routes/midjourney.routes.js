import express from 'express';
import { generateImageToImage, generateTextToImage } from '../controllers/midjourney.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generate image-to-image with Midjourney (requires authentication for credit tracking)
router.post('/image-to-image', authenticate, generateImageToImage);

// Generate text-to-image with Midjourney (requires authentication for credit tracking)
router.post('/text-to-image', authenticate, generateTextToImage);

export default router;