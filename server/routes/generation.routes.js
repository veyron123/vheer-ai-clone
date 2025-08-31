import { Router } from 'express';
import {
  generateImage,
  getGenerationStatus,
  getUserGenerations,
  getAvailableModels,
  getAvailableStyles,
  regenerateImage,
  deleteGeneration,
  getGenerationById
} from '../controllers/generation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/models', getAvailableModels);
router.get('/styles', getAvailableStyles);

// Protected routes
router.post('/', authenticate, generateImage);
router.get('/status/:id', authenticate, getGenerationStatus);
router.get('/history', authenticate, getUserGenerations);
router.get('/:id', authenticate, getGenerationById);
router.post('/:id/regenerate', authenticate, regenerateImage);
router.delete('/:id', authenticate, deleteGeneration);

export default router;