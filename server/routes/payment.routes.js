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

// Payment success redirect handler
router.get('/success', async (req, res) => {
  const lang = req.query.lang || 'en';
  const queryString = new URLSearchParams(req.query).toString();
  const frontendUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
  
  // Redirect to frontend payment success page with query params
  const redirectUrl = `${frontendUrl}/${lang}/payment/success${queryString ? '?' + queryString : ''}`;
  res.redirect(redirectUrl);
});

// Payment failure redirect handler
router.get('/failure', async (req, res) => {
  const lang = req.query.lang || 'en';
  const queryString = new URLSearchParams(req.query).toString();
  const frontendUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
  
  // Redirect to frontend payment failure page with query params
  const redirectUrl = `${frontendUrl}/${lang}/payment/failure${queryString ? '?' + queryString : ''}`;
  res.redirect(redirectUrl);
});

// Alternative route names
router.get('/fail', async (req, res) => {
  const lang = req.query.lang || 'en';
  const queryString = new URLSearchParams(req.query).toString();
  const frontendUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
  
  // Redirect to frontend payment failure page with query params
  const redirectUrl = `${frontendUrl}/${lang}/payment/failure${queryString ? '?' + queryString : ''}`;
  res.redirect(redirectUrl);
});

export default router;