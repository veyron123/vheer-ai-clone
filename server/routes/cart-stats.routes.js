import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCartStats, getAbandonedCartStats, getCarts, getCartById, updateCartById } from '../controllers/cart-stats.controller.js';

const router = Router();

// Cart routes (require authentication)
router.get('/', authenticate, getCarts);
router.get('/stats', authenticate, getCartStats);
router.get('/abandoned', authenticate, getAbandonedCartStats);
router.get('/:id', authenticate, getCartById);
router.patch('/:id', authenticate, updateCartById);
router.put('/:id', authenticate, updateCartById);

export default router;