import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCartStats, getAbandonedCartStats } from '../controllers/cart-stats.controller.js';

const router = Router();

// Cart statistics routes (require authentication)
router.get('/stats', authenticate, getCartStats);
router.get('/abandoned', authenticate, getAbandonedCartStats);

export default router;