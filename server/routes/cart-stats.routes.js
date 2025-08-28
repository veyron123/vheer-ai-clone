import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCartStats, getAbandonedCartStats, getCarts } from '../controllers/cart-stats.controller.js';

const router = Router();

// Cart routes (require authentication)
router.get('/', authenticate, getCarts);
router.get('/stats', authenticate, getCartStats);
router.get('/abandoned', authenticate, getAbandonedCartStats);

export default router;