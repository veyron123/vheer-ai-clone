import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
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
      price: 9.99,
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
      price: 29.99,
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
      price: 99.99,
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