import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCartStats, getAbandonedCartStats, getCarts, getCartById, updateCartById } from '../controllers/cart-stats.controller.js';

const router = Router();

// Cart routes (temporarily without authentication for testing)
router.get('/', getCarts);
router.get('/stats', getCartStats);
router.get('/abandoned', getAbandonedCartStats);
router.get('/:id', getCartById);
router.patch('/:id', updateCartById);
router.put('/:id', updateCartById);

export default router;