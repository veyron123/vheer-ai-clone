import express from 'express';
import { generateImage, generateFromPrompt, generatePetPortrait } from '../controllers/nanobanana.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate image with Nano-Banana (image-to-image transformation)
router.post('/image-to-image', authenticate, generateImage);

// Generate image from prompt with Nano-Banana (text-to-image)
router.post('/generate', authenticate, generateFromPrompt);

// Generate Pet Portrait with dual images (user + style reference)
router.post('/pet-portrait', authenticate, generatePetPortrait);

// Generate Action Figure with dual images (user + style reference)
router.post('/action-figure', authenticate, generatePetPortrait);

export default router;