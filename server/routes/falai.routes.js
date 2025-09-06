import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/fal-ai/pet-portrait
 * @desc    Generate pet portrait using Fal.ai nano-banana with dual images
 * @access  Private (requires authentication)
 */
router.post('/pet-portrait', async (req, res) => {
  try {
    return res.status(503).json({
      error: 'Fal.ai endpoint temporarily disabled - use /api/nano-banana/pet-portrait instead'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/fal-ai/edit
 * @desc    General image editing using Fal.ai nano-banana
 * @access  Private (requires authentication)
 */
router.post('/edit', async (req, res) => {
  try {
    return res.status(503).json({
      error: 'Fal.ai endpoint temporarily disabled - use /api/nano-banana/image-to-image instead'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/fal-ai/status
 * @desc    Check Fal.ai service status and configuration
 * @access  Private (requires authentication)
 */
router.get('/status', async (req, res) => {
  return res.status(200).json({
    status: 'disabled',
    message: 'Fal.ai endpoints temporarily disabled'
  });
});

export default router;