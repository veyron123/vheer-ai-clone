import express from 'express';
import runwayVideoController from '../controllers/runwayVideo.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Development bypass middleware for testing
const developmentBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && !req.header('Authorization')) {
    // Create a mock user for development testing
    req.user = {
      id: 'dev-user-123',
      email: 'dev@test.com',
      username: 'Developer',
      fullName: 'Development User',
      totalCredits: 1000 // Plenty of credits for testing
    };
    console.log('🚨 Development bypass: Using mock user for video generation testing');
    return next();
  }
  // Normal authentication for production or when auth header is provided
  return authenticate(req, res, next);
};

// Apply authentication middleware (with development bypass) to all routes
router.use(developmentBypass);

/**
 * @route   POST /api/runway-video/generate
 * @desc    Generate AI video using Runway API
 * @access  Private
 * @body    {
 *   prompt: string (required) - Text description for video generation,
 *   imageUrl: string (optional) - Reference image URL for image-to-video,
 *   duration: number (optional, default: 5) - Video duration in seconds (5 or 8),
 *   quality: string (optional, default: "720p") - Video quality ("720p" or "1080p"),
 *   aspectRatio: string (optional, default: "16:9") - Video aspect ratio,
 *   waterMark: string (optional, default: "") - Watermark text
 * }
 */
router.post('/generate', runwayVideoController.generateVideo.bind(runwayVideoController));

/**
 * @route   GET /api/runway-video/status/:taskId
 * @desc    Get video generation status
 * @access  Private
 * @param   taskId - Task ID returned from generate endpoint
 */
router.get('/status/:taskId', runwayVideoController.getVideoStatus.bind(runwayVideoController));

/**
 * @route   GET /api/runway-video/options
 * @desc    Get available video generation options and credit costs
 * @access  Private
 */
router.get('/options', runwayVideoController.getOptions.bind(runwayVideoController));

export default router;