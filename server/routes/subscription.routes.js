import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get payment button URLs based on language
const getPaymentUrls = (lang) => {
  if (lang === 'uk' || lang === 'ua') {
    return {
      BASIC: process.env.WAYFORPAY_BASIC_BUTTON_URL_UK,
      PRO: process.env.WAYFORPAY_PRO_BUTTON_URL_UK,
      ENTERPRISE: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL_UK
    };
  } else {
    return {
      BASIC: process.env.WAYFORPAY_BASIC_BUTTON_URL,
      PRO: process.env.WAYFORPAY_PRO_BUTTON_URL,
      ENTERPRISE: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL
    };
  }
};

// Get subscription plans
router.get('/plans', (req, res) => {
  console.log('📋 Plans request received:', {
    lang: req.query.lang,
    headers: req.headers,
    origin: req.get('origin')
  });
  
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
  const paymentUrls = getPaymentUrls(lang);
  
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: currentPricing.prices.FREE,
      currency: currentPricing.currency,
      credits: 100,
      paymentUrl: null, // FREE plan doesn't need payment URL
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
      credits: 800,
      paymentUrl: paymentUrls.BASIC,
      features: [
        '800 credits at purchase',
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
      credits: 3000,
      paymentUrl: paymentUrls.PRO,
      features: [
        '3000 credits at purchase',
        'All models',
        '4K resolution',
        'Priority processing',
        'API access',
        'Commercial use'
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Maximum',
      price: currentPricing.prices.ENTERPRISE,
      currency: currentPricing.currency,
      credits: 15000,
      paymentUrl: paymentUrls.ENTERPRISE,
      features: [
        '15000 credits at purchase',
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