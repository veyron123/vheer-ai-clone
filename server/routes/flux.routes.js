import express from 'express';
import { generateImage, generateImageToImage } from '../controllers/flux.controller.js';

const router = express.Router();

// Generate image with Flux
router.post('/generate', generateImage);

// Generate image-to-image with Flux
router.post('/image-to-image', generateImageToImage);

export default router;