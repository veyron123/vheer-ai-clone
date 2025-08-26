import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
  getOrderNotifications,
  markNotificationsRead
} from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// All order routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Order management
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/notifications', getOrderNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/:id', getOrderById);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;