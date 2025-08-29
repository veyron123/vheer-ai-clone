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

// Payment success redirect handler (both GET and POST)
const handlePaymentSuccess = async (req, res) => {
  const lang = req.query.lang || req.body?.lang || 'en';
  const queryParams = { ...req.query, ...req.body };
  delete queryParams.lang; // Remove lang from query params
  
  const queryString = new URLSearchParams(queryParams).toString();
  const frontendUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
  
  // Redirect to frontend payment success page with query params
  const redirectUrl = `${frontendUrl}/${lang}/payment/success${queryString ? '?' + queryString : ''}`;
  
  console.log(`Payment Success: Redirecting to ${redirectUrl}`);
  res.redirect(redirectUrl);
};

router.get('/success', handlePaymentSuccess);
router.post('/success', handlePaymentSuccess);

// Payment failure redirect handler (both GET and POST)
const handlePaymentFailure = async (req, res) => {
  const lang = req.query.lang || req.body?.lang || 'en';
  const queryParams = { ...req.query, ...req.body };
  delete queryParams.lang; // Remove lang from query params
  
  const queryString = new URLSearchParams(queryParams).toString();
  const frontendUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
  
  // Redirect to frontend payment failure page with query params
  const redirectUrl = `${frontendUrl}/${lang}/payment/failure${queryString ? '?' + queryString : ''}`;
  
  console.log(`Payment Failure: Redirecting to ${redirectUrl}`);
  res.redirect(redirectUrl);
};

router.get('/failure', handlePaymentFailure);
router.post('/failure', handlePaymentFailure);
router.get('/fail', handlePaymentFailure);
router.post('/fail', handlePaymentFailure);

export default router;