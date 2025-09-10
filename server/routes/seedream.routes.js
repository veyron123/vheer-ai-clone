import express from 'express';
import { seedreamGenerate } from '../controllers/seedream.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Optional authentication middleware for development
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    // If token exists, try to authenticate
    authenticate(req, res, next);
  } else {
    // No token in development is OK
    console.log('Development mode: No auth token, proceeding without authentication');
    next();
  }
};

// Generate image with FAL.ai Seedream V4 (optional authentication in development)
if (process.env.NODE_ENV === 'development') {
  // In development, make authentication optional
  router.post('/generate', optionalAuth, seedreamGenerate);
} else {
  // In production, require authentication
  router.post('/generate', authenticate, seedreamGenerate);
}

// Test route without authentication (for development only)
router.post('/generate-test', seedreamGenerate);

// Generate image-to-image with Seedream V4 (alias for generate)
router.post('/image-to-image', authenticate, seedreamGenerate);

export default router;