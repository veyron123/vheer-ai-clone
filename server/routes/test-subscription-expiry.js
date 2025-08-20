import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkExpiredSubscriptions } from '../jobs/subscriptionExpiryJob.js';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// Test endpoint to create a subscription with custom expiry date
router.post('/create-test-subscription', authenticate, async (req, res) => {
  try {
    const { plan = 'BASIC', daysFromNow = 30 } = req.body;
    const userId = req.user.id;
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    
    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: expiryDate
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: expiryDate
      }
    });
    
    // Update user credits based on plan
    const creditsMap = {
      'FREE': 100,
      'BASIC': 800,
      'PRO': 3000,
      'ENTERPRISE': 15000
    };
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalCredits: creditsMap[plan] || 100
      }
    });
    
    logger.info(`🧪 Test subscription created for user ${req.user.email}: ${plan} plan expires ${expiryDate.toISOString()}`);
    
    res.json({
      success: true,
      subscription: {
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: expiryDate,
        daysFromNow
      }
    });
    
  } catch (error) {
    logger.error('Failed to create test subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test subscription'
    });
  }
});

// Test endpoint to manually trigger expiry check
router.post('/check-expired', authenticate, async (req, res) => {
  try {
    logger.info(`🧪 Manual expiry check triggered by user ${req.user.email}`);
    
    await checkExpiredSubscriptions();
    
    res.json({
      success: true,
      message: 'Expiry check completed'
    });
    
  } catch (error) {
    logger.error('Failed to check expired subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check expired subscriptions'
    });
  }
});

// Test endpoint to set subscription to expire yesterday (for testing expiry)
router.post('/expire-subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Set subscription to expire yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        currentPeriodEnd: yesterday
      }
    });
    
    logger.info(`🧪 Subscription set to expire yesterday for user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Subscription set to expire yesterday',
      subscription: {
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
    
  } catch (error) {
    logger.error('Failed to expire subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to expire subscription'
    });
  }
});

// Test endpoint to set user plan for testing pricing page logic
router.post('/set-user-plan', authenticate, async (req, res) => {
  try {
    const { plan = 'FREE', status = 'ACTIVE' } = req.body;
    const userId = req.user.id;
    
    if (!['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be FREE, BASIC, PRO, or ENTERPRISE'
      });
    }
    
    // Calculate expiry date for paid plans (30 days from now)
    let expiryDate = null;
    if (plan !== 'FREE') {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }
    
    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status,
        currentPeriodEnd: expiryDate
      },
      create: {
        userId,
        plan,
        status,
        currentPeriodEnd: expiryDate
      }
    });
    
    // Update user credits based on plan
    const creditsMap = {
      'FREE': 100,
      'BASIC': 800,
      'PRO': 3000,
      'ENTERPRISE': 15000
    };
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalCredits: creditsMap[plan] || 100
      },
      include: {
        subscription: true
      }
    });
    
    logger.info(`🧪 User plan set to ${plan} for testing pricing logic - user: ${req.user.email}`);
    
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        totalCredits: updatedUser.totalCredits,
        subscription: updatedUser.subscription
      },
      message: `User plan set to ${plan} for testing`
    });
    
  } catch (error) {
    logger.error('Failed to set user plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set user plan'
    });
  }
});

export default router;