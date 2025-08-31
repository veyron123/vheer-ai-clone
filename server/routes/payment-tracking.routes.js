import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Start payment process - save user intention before redirect to WayForPay
router.post('/start-payment', authenticate, async (req, res) => {
  const { planId, language } = req.body;
  const userId = req.user.id;

  try {
    console.log('🚀 Starting payment process for user:', userId, 'plan:', planId);

    // Generate unique orderReference with embedded userId for WayForPay
    // Format: ORDER_<userId>_<timestamp> - this will be returned in callback
    const orderReference = `ORDER_${userId}_${Date.now()}`;
    const trackingId = `TRACK_${userId}_${Date.now()}`;

    // Save payment intention to database with orderReference
    await prisma.paymentIntent.create({
      data: {
        trackingId: trackingId,
        orderReference: orderReference, // NEW: Store orderReference for callback matching
        userId: userId,
        planId: planId,
        language: language,
        status: 'INITIATED',
        createdAt: new Date()
      }
    });

    console.log('💾 Payment intent saved:', { trackingId, orderReference, userId, planId });

    // Get payment URL based on plan and language
    const paymentUrls = getPaymentUrls(language);
    const paymentUrl = paymentUrls[planId];

    if (!paymentUrl) {
      return res.status(400).json({
        success: false,
        error: 'Payment URL not found for plan'
      });
    }

    // Add orderReference to payment URL (WayForPay will return this in callback)
    // Note: WayForPay may not preserve custom query params, but orderReference is standard
    const urlWithOrderRef = `${paymentUrl}?orderReference=${orderReference}`;

    res.json({
      success: true,
      paymentUrl: urlWithOrderRef,
      trackingId: trackingId,
      orderReference: orderReference // Frontend can use this for debugging
    });

  } catch (error) {
    console.error('❌ Error starting payment process:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start payment process'
    });
  }
});

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

export default router;