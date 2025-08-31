import express from 'express';
import { 
  getMyImages, 
  updateImageVisibility, 
  deleteImage, 
  getPublicImages,
  downloadImageProxy
} from '../controllers/images.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's saved images (requires authentication)
router.get('/my-images', authenticate, getMyImages);

// Update image visibility (requires authentication)
router.patch('/:imageId/visibility', authenticate, updateImageVisibility);

// Delete image (requires authentication)
router.delete('/:imageId', authenticate, deleteImage);

// Get public images gallery (no authentication required)
router.get('/public', getPublicImages);

// Download image proxy (no authentication required)
router.post('/download', downloadImageProxy);

export default router;