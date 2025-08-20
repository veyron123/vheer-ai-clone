import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import WayForPayRecurringService from '../services/wayforpayRecurringService.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const recurringService = new WayForPayRecurringService();

// Plan configurations (consistent across languages for backend processing)
const PLAN_CONFIG = {
  BASIC: { amount: 400, credits: 800, name: 'Basic Plan' },
  PRO: { amount: 1200, credits: 3000, name: 'Pro Plan' },
  ENTERPRISE: { amount: 4000, credits: 15000, name: 'Maximum Plan' }
};

/**
 * Process automatic recurring payments
 */
const processAutoPayments = async () => {
  try {
    const now = new Date();
    
    // Find all subscriptions that need recurring payment processing
    const subscriptionsNeedingPayment = await prisma.subscription.findMany({
      where: {
        isRecurring: true,
        status: 'ACTIVE',
        recurringToken: { not: null },
        nextPaymentDate: { lte: now },
        failedPaymentAttempts: { lt: 3 } // Don't process if max failed attempts reached
      },
      include: {
        user: true
      }
    });

    logger.info(`🔄 Found ${subscriptionsNeedingPayment.length} subscriptions requiring automatic payment`);

    for (const subscription of subscriptionsNeedingPayment) {
      try {
        await processSingleAutoPayment(subscription);
      } catch (error) {
        logger.error(`❌ Failed to process auto payment for user ${subscription.user.email}:`, error);
      }
    }

    if (subscriptionsNeedingPayment.length > 0) {
      logger.info(`✅ Completed processing ${subscriptionsNeedingPayment.length} automatic payments`);
    }

  } catch (error) {
    logger.error('❌ Failed to process automatic payments:', error);
  }
};

/**
 * Process a single recurring payment
 * @param {Object} subscription 
 */
const processSingleAutoPayment = async (subscription) => {
  const { user, plan, recurringToken, wayforpayOrderReference } = subscription;
  
  logger.info(`💳 Processing automatic payment for user ${user.email} - ${plan} plan`);
  
  try {
    const planConfig = PLAN_CONFIG[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Generate new order reference for this recurring payment
    const newOrderReference = `AUTO_${user.id}_${Date.now()}`;
    
    // Attempt to charge the recurring payment
    const chargeResult = await recurringService.chargeRecurringPayment({
      orderReference: newOrderReference,
      amount: planConfig.amount,
      currency: 'UAH',
      recToken: recurringToken
    });

    if (chargeResult.success && chargeResult.data.transactionStatus === 'Approved') {
      // Payment successful - update subscription and add credits
      await handleSuccessfulAutoPayment(subscription, planConfig, newOrderReference);
      logger.info(`✅ Auto payment successful for user ${user.email}`);
      
    } else {
      // Payment failed - handle failure
      await handleFailedAutoPayment(subscription, chargeResult.error || 'Payment failed');
      logger.error(`❌ Auto payment failed for user ${user.email}:`, chargeResult.error);
    }

  } catch (error) {
    await handleFailedAutoPayment(subscription, error.message);
    throw error;
  }
};

/**
 * Handle successful automatic payment
 * @param {Object} subscription 
 * @param {Object} planConfig 
 * @param {string} orderReference 
 */
const handleSuccessfulAutoPayment = async (subscription, planConfig, orderReference) => {
  const now = new Date();
  const nextPaymentDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  await prisma.$transaction(async (tx) => {
    // Update subscription
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: nextPaymentDate,
        nextPaymentDate: nextPaymentDate,
        lastPaymentDate: now,
        failedPaymentAttempts: 0, // Reset failed attempts
        wayforpayOrderReference: orderReference // Update with new order reference
      }
    });

    // Create payment record
    await tx.payment.create({
      data: {
        userId: subscription.userId,
        amount: planConfig.amount,
        currency: 'UAH',
        status: 'COMPLETED',
        description: `Auto payment - ${planConfig.name}`,
        wayforpayOrderReference: orderReference
      }
    });

    // Add credits to user
    await tx.credit.create({
      data: {
        userId: subscription.userId,
        amount: planConfig.credits,
        type: 'AUTO_RENEWAL',
        description: `Auto renewal - ${planConfig.name} - ${orderReference}`
      }
    });

    // Update user total credits
    await tx.user.update({
      where: { id: subscription.userId },
      data: {
        totalCredits: {
          increment: planConfig.credits
        },
        lastCreditUpdate: now
      }
    });
  });

  logger.info(`🎉 Added ${planConfig.credits} credits to user via auto payment`);
};

/**
 * Handle failed automatic payment
 * @param {Object} subscription 
 * @param {string} errorMessage 
 */
const handleFailedAutoPayment = async (subscription, errorMessage) => {
  const newFailedAttempts = subscription.failedPaymentAttempts + 1;
  const maxAttempts = subscription.maxFailedAttempts || 3;
  
  logger.info(`⚠️ Payment failed for user ${subscription.user.email} - Attempt ${newFailedAttempts}/${maxAttempts}`);

  if (newFailedAttempts >= maxAttempts) {
    // Max attempts reached - cancel subscription
    logger.info(`🚫 Max failed attempts reached - cancelling subscription for user ${subscription.user.email}`);
    
    await prisma.$transaction(async (tx) => {
      // Cancel subscription
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          plan: 'FREE',
          cancelledAt: new Date(),
          failedPaymentAttempts: newFailedAttempts,
          isRecurring: false, // Disable recurring payments
          nextPaymentDate: null
        }
      });

      // Reset user credits to FREE plan level
      await tx.user.update({
        where: { id: subscription.userId },
        data: {
          totalCredits: 100
        }
      });

      // Log the cancellation
      await tx.credit.create({
        data: {
          userId: subscription.userId,
          amount: -subscription.user.totalCredits + 100,
          type: 'AUTO_PAYMENT_FAILED',
          description: `Subscription cancelled due to failed payments: ${errorMessage}`
        }
      });
    });

    logger.info(`✅ Subscription cancelled for user ${subscription.user.email} due to failed payments`);
    
  } else {
    // Increment failed attempts and retry later (next day)
    const nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + 1); // Retry tomorrow
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        failedPaymentAttempts: newFailedAttempts,
        nextPaymentDate: nextRetryDate // Try again tomorrow
      }
    });

    logger.info(`🔄 Will retry payment for user ${subscription.user.email} on ${nextRetryDate.toLocaleDateString()}`);
  }
};

/**
 * Check for subscriptions expiring soon (for notifications)
 */
const checkExpiringSubscriptions = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: { not: 'FREE' },
        isRecurring: false, // Only check non-recurring subscriptions
        currentPeriodEnd: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        user: true
      }
    });

    if (expiringSubscriptions.length > 0) {
      logger.info(`⚠️ Found ${expiringSubscriptions.length} subscriptions expiring within 3 days (non-recurring)`);
      
      for (const subscription of expiringSubscriptions) {
        const daysLeft = Math.ceil((new Date(subscription.currentPeriodEnd) - now) / (1000 * 60 * 60 * 24));
        logger.info(`📧 User ${subscription.user.email} - ${subscription.plan} plan expires in ${daysLeft} days (manual renewal required)`);
      }
    }

  } catch (error) {
    logger.error('❌ Failed to check expiring subscriptions:', error);
  }
};

/**
 * Initialize automatic payment cron jobs
 */
const initializeAutoPaymentJobs = () => {
  // Process auto payments every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('🔄 Running automatic payment processing...');
    await processAutoPayments();
  });

  // Check expiring subscriptions daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    logger.info('🔄 Checking expiring subscriptions...');
    await checkExpiringSubscriptions();
  });

  logger.info('✅ Automatic payment cron jobs initialized');
  logger.info('   - Auto payments: Every hour');
  logger.info('   - Expiry notifications: Daily at 10 AM');
};

export default initializeAutoPaymentJobs;
export { processAutoPayments, checkExpiringSubscriptions };