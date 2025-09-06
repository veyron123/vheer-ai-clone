import express from 'express';
import {
  saveCartSession,
  markCartAsConverted,
  getCartDetails as getCartDetailsFromTracking
} from '../controllers/cart-tracking.controller.js';
import {
  getCarts,
  getCartStats,
  getCartById
} from '../controllers/cart-stats.controller.js';
import { authenticate, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Публичные маршруты (для сохранения корзин)
router.post('/save', saveCartSession); // Может быть вызван без авторизации
router.post('/convert', markCartAsConverted);

// Админские маршруты
router.use(authenticate);
router.use(adminAuth);

router.get('/', getCarts);
router.get('/stats', getCartStats);
router.get('/:id', getCartById);

export default router;