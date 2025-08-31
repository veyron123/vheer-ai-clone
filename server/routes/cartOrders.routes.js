import { Router } from 'express';
import { authenticate, adminAuth } from '../middleware/auth.js';
import {
  getCartOrders,
  getCartOrder,
  updateCartOrder,
  getOrderStats,
  getOrderNotifications,
  markNotificationsRead
} from '../controllers/cartOrders.controller.js';

const router = Router();

// Cart order routes (temporarily without admin check for testing)
// TODO: Re-enable adminAuth after confirming admin access works
router.get('/', authenticate, getCartOrders);
router.get('/stats', authenticate, getOrderStats);
router.get('/notifications', authenticate, getOrderNotifications);
router.post('/notifications/read', authenticate, markNotificationsRead);
router.get('/:id', authenticate, getCartOrder);
router.patch('/:id', authenticate, updateCartOrder);

export default router;