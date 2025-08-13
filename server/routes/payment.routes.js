import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Placeholder for payment routes
router.post('/create-checkout-session', authenticate, async (req, res) => {
  res.json({ message: 'Payment checkout endpoint' });
});

router.post('/webhook', async (req, res) => {
  res.json({ message: 'Payment webhook endpoint' });
});

export default router;