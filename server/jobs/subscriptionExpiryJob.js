import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Check for expired subscriptions and downgrade to FREE plan
 * Resets credits to 100 for expired paid plans
 */
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find all active paid subscriptions that have expired
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: {
          not: 'FREE'
        },
        currentPeriodEnd: {
          lt: now
        }
      },
      include: {
        user: true
      }
    });

    logger.info(`🔍 Found ${expiredSubscriptions.length} expired subscriptions to process`);

    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription to FREE and reset credits
        await prisma.$transaction(async (tx) => {
          // Update subscription
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              plan: 'FREE',
              status: 'EXPIRED',
              currentPeriodEnd: null,
              cancelledAt: now
            }
          });

          // Reset user credits to 100 (FREE plan daily credits)
          await tx.user.update({
            where: { id: subscription.userId },
            data: {
              totalCredits: 100
            }
          });

          // Log credit transaction
          await tx.credit.create({
            data: {
              userId: subscription.userId,
              amount: -subscription.user.totalCredits + 100, // Negative adjustment to reset to 100
              type: 'SUBSCRIPTION_EXPIRED',
              description: `Subscription expired, reset to FREE plan (100 credits)`
            }
          });
        });

        logger.info(`✅ Downgraded expired subscription for user ${subscription.user.email} from ${subscription.plan} to FREE`);
        
      } catch (error) {
        logger.error(`❌ Failed to process expired subscription for user ${subscription.user.email}:`, error);
      }
    }

    if (expiredSubscriptions.length > 0) {
      logger.info(`🎯 Successfully processed ${expiredSubscriptions.length} expired subscriptions`);
    }

  } catch (error) {
    logger.error('❌ Failed to check expired subscriptions:', error);
  }
};

/**
 * Check for subscriptions expiring in the next 7 days for notifications
 */
const checkExpiringSubscriptions = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: {
          not: 'FREE'
        },
        currentPeriodEnd: {
          gte: now,
          lte: sevenDaysFromNow
        }
      },
      include: {
        user: true
      }
    });

    if (expiringSubscriptions.length > 0) {
      logger.info(`⚠️  Found ${expiringSubscriptions.length} subscriptions expiring within 7 days`);
      
      // Here you could add email notification logic
      for (const subscription of expiringSubscriptions) {
        const daysLeft = Math.ceil((new Date(subscription.currentPeriodEnd) - now) / (1000 * 60 * 60 * 24));
        logger.info(`📧 User ${subscription.user.email} - ${subscription.plan} plan expires in ${daysLeft} days`);
      }
    }

  } catch (error) {
    logger.error('❌ Failed to check expiring subscriptions:', error);
  }
};

/**
 * Initialize subscription expiry cron jobs
 */
const initializeSubscriptionExpiryJobs = () => {
  // Run every hour to check for expired subscriptions
  cron.schedule('0 * * * *', async () => {
    logger.info('🔄 Running expired subscription check...');
    await checkExpiredSubscriptions();
  });

  // Run daily at 9 AM to check for expiring subscriptions (for notifications)
  cron.schedule('0 9 * * *', async () => {
    logger.info('🔄 Running expiring subscription check...');
    await checkExpiringSubscriptions();
  });

  logger.info('✅ Subscription expiry cron jobs initialized');
  logger.info('   - Expired subscriptions: Every hour');
  logger.info('   - Expiring subscriptions: Daily at 9 AM');
};

export default initializeSubscriptionExpiryJobs;
export { checkExpiredSubscriptions, checkExpiringSubscriptions };