import { PrismaClient } from '@prisma/client';
import { getModelCredits } from '../config/pricing.config.js';

const prisma = new PrismaClient();

/**
 * Create a new generation record
 * @param {string} userId - User ID
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} Created generation
 */
export async function createGeneration(userId, params) {
  const {
    prompt,
    negativePrompt = '',
    model,
    style = null,
    batchSize = 1,
    status = 'PENDING',
    error = null
  } = params;

  const creditsUsed = getModelCredits(model) * batchSize;

  const generation = await prisma.generation.create({
    data: {
      userId,
      prompt,
      negativePrompt,
      model,
      style,
      batchSize,
      status,
      error,
      creditsUsed,
      completedAt: status === 'COMPLETED' ? new Date() : null
    }
  });

  console.log(`📝 Created generation ${generation.id} for model ${model}`);
  return generation;
}

/**
 * Update generation status
 * @param {string} generationId - Generation ID
 * @param {string} status - New status
 * @param {Object} updates - Additional updates
 */
export async function updateGenerationStatus(generationId, status, updates = {}) {
  const data = {
    status,
    ...updates
  };

  if (status === 'COMPLETED') {
    data.completedAt = new Date();
  }

  const generation = await prisma.generation.update({
    where: { id: generationId },
    data
  });

  console.log(`✅ Updated generation ${generationId} status to ${status}`);
  return generation;
}

/**
 * Mark generation as completed
 * @param {string} generationId - Generation ID
 */
export async function completeGeneration(generationId) {
  return updateGenerationStatus(generationId, 'COMPLETED');
}

/**
 * Mark generation as failed
 * @param {string} generationId - Generation ID
 * @param {string} error - Error message
 */
export async function failGeneration(generationId, error) {
  return updateGenerationStatus(generationId, 'FAILED', { error });
}

/**
 * Get user's generation history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 */
export async function getUserGenerations(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    model = undefined,
    status = undefined
  } = options;

  const where = { userId };
  if (model) where.model = model;
  if (status) where.status = status;

  const generations = await prisma.generation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      images: {
        select: {
          id: true,
          url: true,
          thumbnailUrl: true
        }
      }
    }
  });

  return generations;
}

/**
 * Get generation statistics for user
 * @param {string} userId - User ID
 */
export async function getUserGenerationStats(userId) {
  const stats = await prisma.generation.groupBy({
    by: ['model', 'status'],
    where: { userId },
    _count: true,
    _sum: {
      creditsUsed: true
    }
  });

  const totalGenerations = await prisma.generation.count({
    where: { userId }
  });

  const totalCreditsUsed = await prisma.generation.aggregate({
    where: { userId },
    _sum: {
      creditsUsed: true
    }
  });

  return {
    total: totalGenerations,
    totalCreditsUsed: totalCreditsUsed._sum.creditsUsed || 0,
    byModel: stats
  };
}

/**
 * Clean up old pending generations
 * @param {number} hoursOld - Hours threshold
 */
export async function cleanupPendingGenerations(hoursOld = 24) {
  const threshold = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

  const result = await prisma.generation.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: threshold
      }
    },
    data: {
      status: 'FAILED',
      error: 'Generation timed out'
    }
  });

  if (result.count > 0) {
    console.log(`🧹 Cleaned up ${result.count} old pending generations`);
  }

  return result.count;
}

/**
 * Create generation with transaction (ensures atomicity with credit deduction)
 * @param {string} userId - User ID
 * @param {Object} params - Generation parameters
 * @param {number} creditsToDeduct - Credits to deduct
 */
export async function createGenerationWithCredits(userId, params, creditsToDeduct) {
  return prisma.$transaction(async (tx) => {
    // Create generation
    const generation = await tx.generation.create({
      data: {
        userId,
        prompt: params.prompt,
        negativePrompt: params.negativePrompt || '',
        model: params.model,
        style: params.style || null,
        batchSize: params.batchSize || 1,
        status: 'PENDING',
        creditsUsed: creditsToDeduct
      }
    });

    // Deduct credits
    await tx.user.update({
      where: { id: userId },
      data: {
        totalCredits: {
          decrement: creditsToDeduct
        }
      }
    });

    // Create credit record
    await tx.credit.create({
      data: {
        userId,
        amount: -creditsToDeduct,
        type: 'GENERATION',
        description: `AI generation: ${params.model}`
      }
    });

    return generation;
  });
}