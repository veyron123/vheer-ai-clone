import express from 'express';
import { generateImageTurbo, generateImageUltra } from '../controllers/qwen.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply optional authentication (allows both authenticated and unauthenticated requests)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authenticate(req, res, (error) => {
      if (error) {
        console.log('Auth failed, continuing without user:', error.message);
        req.user = null;
      }
      next();
    });
  } else {
    req.user = null;
    next();
  }
};

// Generate image (text-to-image) - uses Turbo model by default
router.post('/generate', optionalAuth, generateImageTurbo);

// Edit image (image-to-image) - uses Ultra model
router.post('/edit', optionalAuth, generateImageUltra);

// Generate image with Turbo model (explicit)
router.post('/generate-turbo', optionalAuth, generateImageTurbo);

// Generate image with Ultra model (explicit)  
router.post('/generate-ultra', optionalAuth, generateImageUltra);

export default router;