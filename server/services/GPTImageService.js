import axios from 'axios';
import BaseAIService from './base/BaseAIService.js';
import { getModelCredits } from '../config/pricing.config.js';
import logger from '../utils/logger.js';
import queueManager from './QueueService.js';
import { getStandardizedAspectRatio, convertToServiceFormat } from '../utils/aspectRatioUtils.js';

/**
 * GPT Image Service
 * Handles image generation using GPT Image API
 */
class GPTImageService extends BaseAIService {
  constructor() {
    super('GPTImage');
    
    this.apiKey = process.env.GPT_IMAGE_API_KEY;
    this.apiUrl = process.env.GPT_IMAGE_API_URL || 'https://api.kie.ai/api/v1/gpt4o-image/generate';
    this.imgbbKey = process.env.IMGBB_API_KEY;
    
    // Initialize queue worker
    this.initializeWorker();
  }

  /**
   * Initialize queue worker for async processing
   */
  initializeWorker() {
    const queue = queueManager.getQueue('gpt-image-generation');
    
    queue.registerWorker('gpt-generate', async (job) => {
      const { params, userId } = job.data;
      return await this.processGeneration(params, userId);
    });
  }

  /**
   * Generate image with GPT Image
   * @param {Object} params - Generation parameters
   * @param {string} userId - User ID (optional for now)
   * @param {boolean} async - Use async queue processing
   */
  async generate(params, userId = null, async = false) {
    try {
      const { prompt, input_image, style, aspectRatio } = params;
      
      // Validate required parameters
      if (!prompt || !input_image) {
        throw new Error('Prompt and input image are required for GPT Image');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(params);
      const cached = await this.getCachedResult(cacheKey);
      
      if (cached) {
        logger.info('Returning cached GPT Image result', { cacheKey });
        return cached;
      }

      // Check user credits if authenticated
      const modelId = 'gpt-image';
      const requiredCredits = getModelCredits(modelId);
      
      if (userId) {
        const creditCheck = await this.checkUserCredits(userId, requiredCredits);
        
        if (!creditCheck.canAfford) {
          throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${creditCheck.available}`);
        }
      } else {
        logger.warn('Processing GPT Image without authentication - testing mode');
      }

      // If async, add to queue
      if (async) {
        const queue = queueManager.getQueue('gpt-image-generation');
        const job = await queue.add('gpt-generate', {
          params,
          userId
        }, {
          priority: userId ? 1 : 0 // Lower priority for unauthenticated
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
    const { prompt, input_image, style, aspectRatio } = params;
    const modelId = 'gpt-image';
    const requiredCredits = getModelCredits(modelId);

    // Create generation record if user is authenticated
    let generation = null;
    if (userId) {
      generation = await this.createGenerationRecord({
        userId,
        prompt,
        model: modelId,
        style,
        creditsUsed: requiredCredits,
        status: 'PROCESSING'
      });
    }

    try {
      // Upload input image if it's base64
      let imageUrl = input_image;
      if (!input_image.startsWith('http')) {
        imageUrl = await this.uploadImage(input_image);
      }

      // Build request payload
      const payload = this.buildGPTImagePayload({
        ...params,
        input_image: imageUrl
      });
      
      logger.info('Calling GPT Image API', {
        hasImage: !!imageUrl,
        aspectRatio
      });

      // Call GPT Image API
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 90 seconds timeout
      });

      if (!response.data || !response.data.image_url) {
        throw new Error('No image URL in GPT Image response');
      }

      const resultUrl = response.data.image_url;

      // Deduct credits if user is authenticated
      if (userId) {
        await this.deductCredits(userId, requiredCredits, `GPT Image generation`);

        // Save image
        const image = await this.saveImage({
          userId,
          generationId: generation?.id,
          url: resultUrl,
          prompt,
          model: modelId,
          style,
          width: 1024,
          height: 1024
        });

        // Update generation status
        if (generation) {
          await this.updateGenerationStatus(generation.id, 'COMPLETED');
        }
      }

      // Cache result
      const result = {
        success: true,
        url: resultUrl,
        model: modelId,
        creditsUsed: requiredCredits,
        generationId: generation?.id
      };
      
      await this.cacheResult(cacheKey, result, 3600); // Cache for 1 hour

      return result;
    } catch (error) {
      // Update generation status to failed
      if (generation) {
        await this.updateGenerationStatus(generation.id, 'FAILED', {
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Build GPT Image API payload
   */
  buildGPTImagePayload(params) {
    const { prompt, input_image, style, aspectRatio } = params;
    
    // Combine style with prompt if provided
    const fullPrompt = style && style !== 'none' 
      ? `${prompt}, ${style} style`
      : prompt;

    // Map aspect ratio to GPT Image supported sizes using standardized logic
    const standardizedRatio = getStandardizedAspectRatio(aspectRatio);
    const size = convertToServiceFormat(standardizedRatio, 'gpt-image');

    return {
      prompt: fullPrompt,
      input_image,
      size,
      num_images: 1,
      response_format: 'url'
    };
  }

  /**
   * Map aspect ratio to GPT Image supported sizes
   * @deprecated Use aspectRatioUtils.js convertToServiceFormat instead
   */
  mapAspectRatioToSize(aspectRatio) {
    console.warn('mapAspectRatioToSize is deprecated, use aspectRatioUtils.js instead');
    const standardizedRatio = getStandardizedAspectRatio(aspectRatio);
    return convertToServiceFormat(standardizedRatio, 'gpt-image');
  }

  /**
   * Upload base64 image to ImgBB
   */
  async uploadImage(base64Image) {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      
      logger.info('Uploading image to ImgBB');

      const formData = new FormData();
      formData.append('image', cleanBase64);
      formData.append('key', this.imgbbKey);

      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.data && response.data.data && response.data.data.url) {
        logger.info('Image uploaded successfully to ImgBB');
        return response.data.data.url;
      }

      throw new Error('Failed to upload image to ImgBB');
    } catch (error) {
      logger.error('ImgBB upload failed', error);
      
      // Fallback: try Cloudinary or return original if it's already a URL
      if (base64Image.startsWith('http')) {
        return base64Image;
      }
      
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  /**
   * Get job status from queue
   */
  async getJobStatus(jobId) {
    const queue = queueManager.getQueue('gpt-image-generation');
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
const gptImageService = new GPTImageService();
export default gptImageService;