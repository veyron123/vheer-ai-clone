import express from 'express';
import { generateImageTurbo, generateImageUltra } from '../controllers/qwen.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Debug middleware to track requests
const debugQwenRequest = (req, res, next) => {
  console.log('🚨 [QWEN ROUTES] Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    hasAuth: !!req.headers.authorization,
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });
  next();
};

// Use same authentication as Nano-Banana (required authentication)
// Generate image (text-to-image) - uses Turbo model by default
router.post('/generate', debugQwenRequest, authenticate, generateImageTurbo);

// Edit image (image-to-image) - uses Ultra model
router.post('/edit', debugQwenRequest, authenticate, generateImageUltra);

// Generate image with Turbo model (explicit)
router.post('/generate-turbo', debugQwenRequest, authenticate, generateImageTurbo);

// Generate image with Ultra model (explicit)  
router.post('/generate-ultra', debugQwenRequest, authenticate, generateImageUltra);

export default router;