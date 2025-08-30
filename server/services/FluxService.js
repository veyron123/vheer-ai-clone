import axios from 'axios';
import BaseAIService from './base/BaseAIService.js';
import { getModelCredits } from '../config/pricing.config.js';
import logger from '../utils/logger.js';
import queueManager from './QueueService.js';
import { getStandardizedAspectRatio, convertToServiceFormat } from '../utils/aspectRatioUtils.js';

/**
 * Flux AI Service
 * Handles image generation using Flux API
 */
class FluxService extends BaseAIService {
  constructor() {
    super('Flux');
    
    this.apiKey = process.env.FLUX_API_KEY;
    this.apiUrl = process.env.FLUX_API_URL || 'https://api.bfl.ai/v1/flux-kontext-pro';
    this.statusUrl = 'https://api.bfl.ai/v1/get_result';
    
    // Initialize queue worker
    this.initializeWorker();
  }

  /**
   * Initialize queue worker for async processing
   */
  initializeWorker() {
    const queue = queueManager.getQueue('flux-generation');
    
    queue.registerWorker('flux-generate', async (job) => {
      const { params, userId } = job.data;
      return await this.processGeneration(params, userId);
    });
  }

  /**
   * Generate image with Flux
   * @param {Object} params - Generation parameters
   * @param {string} userId - User ID
   * @param {boolean} async - Use async queue processing
   */
  async generate(params, userId, async = false) {
    try {
      const { prompt, input_image, style, model, aspectRatio } = params;
      
      // Validate required parameters
      if (!prompt) {
        throw new Error('Prompt is required');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(params);
      const cached = await this.getCachedResult(cacheKey);
      
      if (cached && !input_image) { // Don't use cache for image-to-image
        logger.info('Returning cached Flux result', { cacheKey });
        return cached;
      }

      // Check user credits
      const modelId = model || 'flux-pro';
      const requiredCredits = getModelCredits(modelId);
      const creditCheck = await this.checkUserCredits(userId, requiredCredits);
      
      if (!creditCheck.canAfford) {
        throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${creditCheck.available}`);
      }

      // If async, add to queue
      if (async) {
        const queue = queueManager.getQueue('flux-generation');
        const job = await queue.add('flux-generate', {
          params,
          userId
        }, {
          priority: creditCheck.available > 100 ? 1 : 0 // Higher priority for users with more credits
        });
        
        return {
          jobId: job.id,
          status: 'queued',
          message: 'Your image is being generated. Check back soon!'
        };
      }

      // Process synchronously
      return await this.processGeneration(params, userId);
    } catch (error) {
      return this.handleError(error, 'generate');
    }
  }

  /**
   * Process the actual generation
   */
  async processGeneration(params, userId) {
    const { prompt, input_image, style, model, aspectRatio } = params;
    const modelId = model || 'flux-pro';
    const requiredCredits = getModelCredits(modelId);

    // Create generation record
    const generation = await this.createGenerationRecord({
      userId,
      prompt,
      model: modelId,
      style,
      creditsUsed: requiredCredits,
      status: 'PROCESSING'
    });

    try {
      // Build request payload
      const payload = this.buildFluxPayload(params);
      
      logger.info('Calling Flux API', {
        model: modelId,
        hasImage: !!input_image,
        aspectRatio
      });

      // Call Flux API
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'x-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });

      const taskId = response.data.id;
      
      // Poll for result
      const result = await this.pollForResult(taskId);
      
      if (!result || !result.result) {
        throw new Error('No result received from Flux API');
      }

      // Deduct credits
      await this.deductCredits(userId, requiredCredits, `Flux ${modelId} generation`);

      // Save image
      const image = await this.saveImage({
        userId,
        generationId: generation.id,
        url: result.result.sample,
        prompt,
        model: modelId,
        style,
        width: result.result.width || 1024,
        height: result.result.height || 1024
      });

      // Update generation status
      await this.updateGenerationStatus(generation.id, 'COMPLETED');

      // Cache result (for non-image-to-image)
      if (!input_image) {
        const cacheKey = this.generateCacheKey(params);
        await this.cacheResult(cacheKey, {
          url: image.url,
          width: image.width,
          height: image.height,
          model: modelId
        }, 3600); // Cache for 1 hour
      }

      return {
        success: true,
        url: image.url,
        width: image.width,
        height: image.height,
        model: modelId,
        creditsUsed: requiredCredits,
        generationId: generation.id
      };
    } catch (error) {
      // Update generation status to failed
      await this.updateGenerationStatus(generation.id, 'FAILED', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Build Flux API payload
   */
  buildFluxPayload(params) {
    const { prompt, input_image, style, aspectRatio } = params;
    
    // Combine style with prompt if provided
    const fullPrompt = style && style !== 'none' 
      ? `${prompt}, ${style} style`
      : prompt;

    const payload = {
      prompt: fullPrompt,
      width: 1024,
      height: 1024,
      steps: 25,
      guidance: 3.5
    };

    // Handle aspect ratio using standardized logic
    if (aspectRatio) {
      const standardizedRatio = getStandardizedAspectRatio(aspectRatio);
      const { width, height } = convertToServiceFormat(standardizedRatio, 'flux');
      payload.width = width;
      payload.height = height;
    }

    // Add input image for image-to-image
    if (input_image) {
      // Remove data URL prefix if present
      const base64Image = input_image.replace(/^data:image\/\w+;base64,/, '');
      payload.init_image = base64Image;
      payload.image_strength = 0.75; // Control how much to change the image
    }

    return payload;
  }

  /**
   * Get Flux dimensions based on aspect ratio
   * @deprecated Use aspectRatioUtils.js convertToServiceFormat instead
   */
  getFluxDimensions(aspectRatio) {
    // This method is deprecated - use standardized aspect ratio utilities
    console.warn('getFluxDimensions is deprecated, use aspectRatioUtils.js instead');
    const standardizedRatio = getStandardizedAspectRatio(aspectRatio);
    return convertToServiceFormat(standardizedRatio, 'flux');
  }

  /**
   * Poll for generation result
   */
  async pollForResult(taskId, maxAttempts = 30) {
    // Start with 3 second delay, increase on rate limit errors
    let pollDelay = 3000;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${this.statusUrl}?id=${taskId}`, {
          headers: {
            'x-key': this.apiKey
          }
        });

        if (response.data.status === 'Ready') {
          return response.data;
        }

        if (response.data.status === 'Failed') {
          throw new Error('Generation failed: ' + (response.data.error || 'Unknown error'));
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollDelay));
      } catch (error) {
        // Handle rate limiting
        if (error.response?.status === 429) {
          logger.warn('Rate limited, increasing poll delay', { 
            attempt: i, 
            currentDelay: pollDelay 
          });
          // Exponentially increase delay on rate limit
          pollDelay = Math.min(pollDelay * 2, 10000); // Max 10 seconds
          await new Promise(resolve => setTimeout(resolve, pollDelay));
        } else if (i === maxAttempts - 1) {
          throw error;
        } else {
          // Continue polling on other transient errors
          await new Promise(resolve => setTimeout(resolve, pollDelay));
        }
      }
    }

    throw new Error('Generation timed out');
  }

  /**
   * Get job status from queue
   */
  async getJobStatus(jobId) {
    const queue = queueManager.getQueue('flux-generation');
    const job = queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.lastError
    };
  }
}

// Export singleton instance
const fluxService = new FluxService();
export default fluxService;