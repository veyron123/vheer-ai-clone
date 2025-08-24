import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { generateTextToImage } from '../controllers/gptImageTextToImage.controller.js';

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

// GPT Image text-to-image generation endpoint
router.post('/generate', optionalAuth, generateTextToImage);

export default router;