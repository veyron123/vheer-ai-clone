import express from 'express';
import { generateImage, generateImageToImage } from '../controllers/gptimage.controller.js';

const router = express.Router();

// Generate image with GPT IMAGE
router.post('/generate', generateImage);

// Generate image-to-image with GPT IMAGE
router.post('/image-to-image', generateImageToImage);

export default router;