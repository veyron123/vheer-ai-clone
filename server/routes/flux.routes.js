import express from 'express';
import { generateImage } from '../controllers/flux.controller.js';

const router = express.Router();

// Generate image with Flux
router.post('/generate', generateImage);

export default router;