import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  // Get language from query params or headers
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'uk';
  
  // Define pricing based on language
  const pricing = {
    uk: {
      currency: '₴',
      prices: { FREE: 0, BASIC: 400, PRO: 1200, ENTERPRISE: 4000 }
    },
    en: {
      currency: '$',
      prices: { FREE: 0, BASIC: 10, PRO: 30, ENTERPRISE: 99 }
    }
  };
  
  const currentPricing = pricing[lang] || pricing.uk;
  
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: currentPricing.prices.FREE,
      currency: currentPricing.currency,
      credits: 100,
      features: [
        '100 free credits daily',
        'Basic models',
        'Standard resolution',
        'Community support'
      ]
    },
    {
      id: 'BASIC',
      name: 'Basic',
      price: currentPricing.prices.BASIC,
      currency: currentPricing.currency,
      credits: 100,
      features: [
        '100 credits monthly',
        'All models',
        'HD resolution',
        'Priority support',
        'Private images'
      ]
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: currentPricing.prices.PRO,
      currency: currentPricing.currency,
      credits: 500,
      features: [
        '500 credits monthly',
        'All models',
        '4K resolution',
        'Priority processing',
        'API access',
        'Commercial use'
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: currentPricing.prices.ENTERPRISE,
      currency: currentPricing.currency,
      credits: 2000,
      features: [
        '2000 credits monthly',
        'Custom models',
        'Unlimited resolution',
        'Dedicated support',
        'Team collaboration',
        'Custom integrations'
      ]
    }
  ];
  
  res.json(plans);
});

// Get current subscription
router.get('/current', authenticate, async (req, res) => {
  res.json(req.user.subscription || { plan: 'FREE', status: 'ACTIVE' });
});

export default router;