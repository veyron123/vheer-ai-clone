import express from 'express';
import {
  saveCartSession,
  markCartAsConverted,
  getActiveCarts,
  getCartDetails,
  getCartStats
} from '../controllers/cart-tracking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Публичные маршруты (для сохранения корзин)
router.post('/save', saveCartSession); // Может быть вызван без авторизации
router.post('/convert', markCartAsConverted);

// Админские маршруты
router.use(authenticate);
router.use(isAdmin);

router.get('/', getActiveCarts);
router.get('/stats', getCartStats);
router.get('/:id', getCartDetails);

export default router;