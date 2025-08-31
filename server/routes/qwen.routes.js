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

// Generate image with Turbo model
router.post('/generate-turbo', optionalAuth, generateImageTurbo);

// Generate image with Ultra model
router.post('/generate-ultra', optionalAuth, generateImageUltra);

export default router;