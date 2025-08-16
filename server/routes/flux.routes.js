import express from 'express';
import { generateImage, generateImageToImage } from '../controllers/flux.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

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

// Generate image with Flux (optional authentication in development)
if (process.env.NODE_ENV === 'development') {
  // In development, make authentication optional
  router.post('/generate', optionalAuth, generateImage);
} else {
  // In production, require authentication
  router.post('/generate', authenticate, generateImage);
}

// Test route without authentication (for development only)
router.post('/generate-test', generateImage);

// Generate image-to-image with Flux (requires authentication for credit tracking)
router.post('/image-to-image', authenticate, generateImageToImage);

export default router;