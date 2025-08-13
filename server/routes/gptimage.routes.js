import express from 'express';
import { generateImage } from '../controllers/gptimage.controller.js';

const router = express.Router();

// Generate image with GPT IMAGE
router.post('/generate', generateImage);

export default router;