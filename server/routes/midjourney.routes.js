import express from 'express';
import { generateImageToImage, generateTextToImage } from '../controllers/midjourney.controller.js';

const router = express.Router();

// Generate image-to-image with Midjourney
router.post('/image-to-image', generateImageToImage);

// Generate text-to-image with Midjourney
router.post('/text-to-image', generateTextToImage);

export default router;