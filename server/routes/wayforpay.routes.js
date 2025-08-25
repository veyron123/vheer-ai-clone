import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  initializePayment,
  handleCallback,
  checkPaymentStatus,
  cancelSubscription,
  initializeCartPayment,
  handleCartCallback
} from '../controllers/wayforpay.controller.js';

const router = Router();

// Initialize payment (requires authentication)
router.post('/init', authenticate, initializePayment);

// Handle WayForPay callback (no auth required - called by WayForPay)
router.post('/callback', handleCallback);

// Check payment status
router.get('/status/:orderId', authenticate, checkPaymentStatus);

// Cancel subscription
router.post('/cancel', authenticate, cancelSubscription);

// === CART PAYMENT ROUTES (One-time payments) ===

// Initialize cart payment (no auth required - allows guest checkout)
router.post('/cart-checkout', initializeCartPayment);

// Handle WayForPay callback for cart payments (no auth required)
router.post('/cart-callback', handleCartCallback);

export default router;