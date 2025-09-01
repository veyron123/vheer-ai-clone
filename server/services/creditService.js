import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { getModelCredits } from '../config/pricing.config.js';

/**
 * Check if user has enough credits for the operation
 * @param {string} userId - User ID
 * @param {string} modelId - AI model ID
 * @returns {Promise<{user: Object, requiredCredits: number}>}
 */
export async function checkCredits(userId, modelId) {
  if (!userId) {
    throw new AppError('User authentication required', 401);
  }

  const requiredCredits = getModelCredits(modelId);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      totalCredits: true,
      email: true,
      username: true,
      subscription: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.totalCredits < requiredCredits) {
    throw new AppError('Insufficient credits', 400, {
      required: requiredCredits,
      available: user.totalCredits,
      modelId
    });
  }

  return { user, requiredCredits };
}

/**
 * Deduct credits from user account
 * @param {string} userId - User ID
 * @param {number} credits - Credits to deduct
 * @returns {Promise<Object>} Updated user
 */
export async function deductCredits(userId, credits) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalCredits: {
        decrement: credits
      }
    },
    select: {
      id: true,
      totalCredits: true
    }
  });

  // Create credit transaction record
  await prisma.credit.create({
    data: {
      userId,
      amount: -credits,
      type: 'GENERATION',
      description: 'AI image generation'
    }
  });

  console.log(`✅ Deducted ${credits} credits from user ${userId}. Remaining: ${updatedUser.totalCredits}`);
  
  return updatedUser;
}

/**
 * Check and deduct credits in one transaction
 * @param {string} userId - User ID
 * @param {string} modelId - AI model ID
 * @returns {Promise<{user: Object, creditsUsed: number}>}
 */
export async function checkAndDeductCredits(userId, modelId) {
  const { user, requiredCredits } = await checkCredits(userId, modelId);
  
  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Double-check credits in transaction
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { totalCredits: true }
    });

    if (currentUser.totalCredits < requiredCredits) {
      throw new AppError('Insufficient credits', 400, {
        required: requiredCredits,
        available: currentUser.totalCredits
      });
    }

    // Deduct credits
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        totalCredits: {
          decrement: requiredCredits
        }
      }
    });

    // Create credit transaction record
    await tx.credit.create({
      data: {
        userId,
        amount: -requiredCredits,
        type: 'GENERATION',
        description: `AI generation: ${modelId}`
      }
    });

    return { user: updatedUser, creditsUsed: requiredCredits };
  });

  console.log(`✅ Successfully processed ${requiredCredits} credits for model ${modelId}`);
  return result;
}

/**
 * Refund credits to user (for failed generations)
 * @param {string} userId - User ID
 * @param {number} credits - Credits to refund
 * @param {string} reason - Reason for refund
 */
export async function refundCredits(userId, credits, reason = 'Generation failed') {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalCredits: {
        increment: credits
      }
    }
  });

  await prisma.credit.create({
    data: {
      userId,
      amount: credits,
      type: 'REFUND',
      description: reason
    }
  });

  console.log(`💰 Refunded ${credits} credits to user ${userId}. Total: ${updatedUser.totalCredits}`);
  return updatedUser;
}

/**
 * Get user's credit information
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User credit information
 */
export async function getUserCredits(userId) {
  const startTime = Date.now();
  console.log(`[getUserCredits] Fetching credits for user: ${userId}`);
  
  try {
    // Добавляем таймаут для запроса к БД (5 секунд)
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          totalCredits: true,
          email: true,
          username: true,
          subscription: true
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout after 5s')), 5000)
      )
    ]);
    
    const queryTime = Date.now() - startTime;
    console.log(`[getUserCredits] Query completed in ${queryTime}ms`);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Если запрос занял больше 1 секунды, логируем предупреждение
    if (queryTime > 1000) {
      console.warn(`[getUserCredits] Slow query detected: ${queryTime}ms for user ${userId}`);
    }
    
    return user;
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`[getUserCredits] Error after ${queryTime}ms:`, error.message);
    throw error;
  }
}

/**
 * Get user's credit balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} Credit balance
 */
export async function getCreditBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalCredits: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.totalCredits;
}

/**
 * Check and add daily credits to user if needed
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with credits added
 */
export async function checkAndAddDailyCredits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      totalCredits: true,
      lastCreditUpdate: true,
      subscription: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if 24 hours have passed since last credit update
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (user.lastCreditUpdate < oneDayAgo) {
    // Add daily credits based on subscription plan
    const dailyCredits = user.subscription?.plan === 'PREMIUM' ? 500 : 100;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalCredits: {
          increment: dailyCredits
        },
        lastCreditUpdate: now
      }
    });

    // Log the credit addition
    await prisma.credit.create({
      data: {
        userId,
        amount: dailyCredits,
        type: 'DAILY',
        description: 'Daily credit bonus'
      }
    });

    console.log(`💰 Added ${dailyCredits} daily credits to user ${userId}`);
    return { creditsAdded: dailyCredits, newTotal: updatedUser.totalCredits };
  }

  return { creditsAdded: 0, newTotal: user.totalCredits };
}

/**
 * Add daily credits to all users (for cron job)
 * @returns {Promise<Object>} Result with stats
 */
export async function addDailyCreditsToAllUsers() {
  const users = await prisma.user.findMany({
    select: { 
      id: true,
      totalCredits: true,
      lastCreditUpdate: true,
      subscription: true
    }
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  let usersUpdated = 0;
  let totalCreditsAdded = 0;

  for (const user of users) {
    if (user.lastCreditUpdate < oneDayAgo) {
      const dailyCredits = user.subscription?.plan === 'PREMIUM' ? 500 : 100;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalCredits: {
            increment: dailyCredits
          },
          lastCreditUpdate: now
        }
      });

      await prisma.credit.create({
        data: {
          userId: user.id,
          amount: dailyCredits,
          type: 'DAILY',
          description: 'Daily credit bonus (cron)'
        }
      });

      usersUpdated++;
      totalCreditsAdded += dailyCredits;
    }
  }

  console.log(`💰 Daily credits added: ${usersUpdated} users, ${totalCreditsAdded} total credits`);
  return { usersUpdated, totalCreditsAdded };
}

/**
 * Check if user can afford generation without deducting
 * @param {string} userId - User ID
 * @param {string} modelId - AI model ID
 * @returns {Promise<boolean>}
 */
export async function canAfford(userId, modelId) {
  try {
    const { user, requiredCredits } = await checkCredits(userId, modelId);
    return user.totalCredits >= requiredCredits;
  } catch (error) {
    if (error.statusCode === 400) {
      return false;
    }
    throw error;
  }
}