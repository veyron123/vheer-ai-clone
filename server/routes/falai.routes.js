import express from 'express';
import { 
  generatePetPortrait, 
  generateImage, 
  getServiceStatus 
} from '../controllers/falai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/fal-ai/pet-portrait
 * @desc    Generate pet portrait using Fal.ai nano-banana with dual images
 * @access  Private (requires authentication)
 * @body    {
 *   userImageUrl: string,     // User's pet photo URL or base64
 *   styleImageUrl: string,    // Style reference image URL or base64
 *   styleName: string,        // Name of the style (e.g., "Royal Portrait")
 *   prompt: string,           // Custom prompt for generation
 *   aspectRatio?: string,     // Aspect ratio (default: "1:1")
 *   num_images?: number       // Number of images to generate (default: 1)
 * }
 */
router.post('/pet-portrait', 
  generatePetPortrait
);

/**
 * @route   POST /api/fal-ai/edit
 * @desc    General image editing using Fal.ai nano-banana
 * @access  Private (requires authentication)
 * @body    {
 *   prompt: string,           // Editing instructions
 *   image_urls: string[],     // Array of image URLs or base64 strings
 *   num_images?: number,      // Number of images to generate (default: 1)
 *   output_format?: string    // "png" or "jpeg" (default: "png")
 * }
 */
router.post('/edit',
  generateImage
);

/**
 * @route   GET /api/fal-ai/status
 * @desc    Check Fal.ai service status and configuration
 * @access  Private (requires authentication)
 */
router.get('/status', getServiceStatus);

export default router;