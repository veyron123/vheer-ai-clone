import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '../../utils/logger.js';
import CacheService from '../CacheService.js';

/**
 * Base class for all AI generation services
 * Provides common functionality for credit checks, caching, and error handling
 */
class BaseAIService {
  constructor(providerName) {
    this.providerName = providerName;
    this.prisma = new PrismaClient();
    this.cache = new CacheService();
  }

  /**
   * Check if user has sufficient credits
   * @param {string} userId - User ID
   * @param {number} requiredCredits - Credits required for operation
   * @returns {Promise<{canAfford: boolean, available: number}>}
   */
  async checkUserCredits(userId, requiredCredits) {
    try {
      // Try to get from cache first
      const cacheKey = `user_credits:${userId}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        const available = parseInt(cached);
        return {
          canAfford: available >= requiredCredits,
          available
        };
      }

      // Get from database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { totalCredits: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Cache for 1 minute
      await this.cache.set(cacheKey, user.totalCredits.toString(), 60);

      return {
        canAfford: user.totalCredits >= requiredCredits,
        available: user.totalCredits
      };
    } catch (error) {
      logger.error(`Failed to check credits for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Deduct credits from user account
   * @param {string} userId - User ID
   * @param {number} credits - Credits to deduct
   * @param {string} description - Description of the transaction
   */
  async deductCredits(userId, credits, description) {
    try {
      // Update user credits
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalCredits: {
            decrement: credits
          }
        }
      });

      // Create credit transaction record
      await this.prisma.credit.create({
        data: {
          userId,
          amount: -credits,
          type: 'USAGE',
          description: description || `${this.providerName} generation`
        }
      });

      // Invalidate cache
      await this.cache.delete(`user_credits:${userId}`);

      logger.info('Credits deducted', {
        userId,
        credits,
        remaining: user.totalCredits,
        provider: this.providerName
      });

      return user.totalCredits;
    } catch (error) {
      logger.error(`Failed to deduct credits for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Create generation record
   * @param {Object} params - Generation parameters
   */
  async createGenerationRecord(params) {
    const {
      userId,
      prompt,
      model,
      style,
      creditsUsed,
      status = 'PENDING'
    } = params;

    try {
      const generation = await this.prisma.generation.create({
        data: {
          userId,
          prompt,
          model,
          style,
          creditsUsed,
          status
        }
      });

      logger.info('Generation record created', {
        generationId: generation.id,
        userId,
        model,
        provider: this.providerName
      });

      return generation;
    } catch (error) {
      logger.error('Failed to create generation record', error);
      throw error;
    }
  }

  /**
   * Update generation status
   * @param {string} generationId - Generation ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   */
  async updateGenerationStatus(generationId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      const generation = await this.prisma.generation.update({
        where: { id: generationId },
        data: updateData
      });

      logger.info('Generation status updated', {
        generationId,
        status,
        provider: this.providerName
      });

      return generation;
    } catch (error) {
      logger.error(`Failed to update generation ${generationId}`, error);
      throw error;
    }
  }

  /**
   * Save generated image
   * @param {Object} params - Image parameters
   */
  async saveImage(params) {
    const {
      userId,
      generationId,
      url,
      prompt,
      model,
      style,
      width,
      height
    } = params;

    try {
      const image = await this.prisma.image.create({
        data: {
          userId,
          generationId,
          url,
          prompt,
          model: model || this.providerName,
          style,
          width: width || 1024,
          height: height || 1024
        }
      });

      logger.info('Image saved', {
        imageId: image.id,
        userId,
        generationId,
        provider: this.providerName
      });

      return image;
    } catch (error) {
      logger.error('Failed to save image', error);
      throw error;
    }
  }

  /**
   * Get cached result if available
   * @param {string} cacheKey - Cache key
   */
  async getCachedResult(cacheKey) {
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { cacheKey, provider: this.providerName });
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Cache retrieval failed', error);
      return null;
    }
  }

  /**
   * Cache generation result
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Result to cache
   * @param {number} ttl - Time to live in seconds
   */
  async cacheResult(cacheKey, result, ttl = 3600) {
    try {
      await this.cache.set(cacheKey, JSON.stringify(result), ttl);
      logger.debug('Result cached', { cacheKey, ttl, provider: this.providerName });
    } catch (error) {
      logger.error('Cache storage failed', error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Generate cache key for request
   * @param {Object} params - Request parameters
   */
  generateCacheKey(params) {
    const { prompt, model, style, aspectRatio } = params;
    const normalized = [
      this.providerName,
      model,
      style,
      aspectRatio,
      prompt?.toLowerCase().trim()
    ].filter(Boolean).join(':');
    
    // Simple hash for shorter keys
    const hash = crypto
      .createHash('md5')
      .update(normalized)
      .digest('hex');
    
    return `gen:${hash}`;
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @param {string} operation - Operation name
   */
  handleError(error, operation) {
    const errorData = {
      provider: this.providerName,
      operation,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };

    logger.error(`${this.providerName} ${operation} failed`, error, errorData);

    // Return user-friendly error
    if (error.response?.status === 401) {
      return {
        error: 'API authentication failed',
        message: 'Please check API configuration'
      };
    }

    if (error.response?.status === 429) {
      return {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      };
    }

    if (error.response?.status >= 500) {
      return {
        error: 'Service temporarily unavailable',
        message: 'The AI service is experiencing issues. Please try again.'
      };
    }

    return {
      error: 'Generation failed',
      message: error.message || 'An unexpected error occurred'
    };
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async generate(params) {
    throw new Error('generate() method must be implemented by subclass');
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

export default BaseAIService;