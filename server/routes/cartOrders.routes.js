import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import {
  getCartOrders,
  getCartOrder,
  updateCartOrder,
  getOrderStats,
  getOrderNotifications,
  markNotificationsRead
} from '../controllers/cartOrders.controller.js';

const router = Router();

// Admin routes (require authentication and admin role)
router.get('/', authenticate, isAdmin, getCartOrders);
router.get('/stats', authenticate, isAdmin, getOrderStats);
router.get('/notifications', authenticate, isAdmin, getOrderNotifications);
router.post('/notifications/read', authenticate, isAdmin, markNotificationsRead);
router.get('/:id', authenticate, isAdmin, getCartOrder);
router.patch('/:id', authenticate, isAdmin, updateCartOrder);

export default router;