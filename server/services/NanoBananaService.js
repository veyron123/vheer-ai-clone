import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import BaseAIService from './base/BaseAIService.js';
import { getModelCredits } from '../config/pricing.config.js';
import logger from '../utils/logger.js';
import queueManager from './QueueService.js';
import { getStandardizedAspectRatio, convertToServiceFormat } from '../utils/aspectRatioUtils.js';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Nano-Banana Service (Gemini 2.5 Flash Image)
 * Handles image generation using Google's Gemini AI
 */
class NanoBananaService extends BaseAIService {
  constructor() {
    super('NanoBanana');
    
    this.apiKey = process.env.NANO_BANANA_API_KEY || 'AIzaSyCztVZluFy-BzhJovZFKnT3Rwn7_4FoOcw';
    this.imgbbKey = process.env.IMGBB_API_KEY;
    this.modelName = 'gemini-2.5-flash-image-preview';
    
    // Initialize Google GenAI
    this.ai = new GoogleGenAI({
      apiKey: this.apiKey
    });
    
    // Initialize queue worker
    this.initializeWorker();
  }

  /**
   * Initialize queue worker for async processing
   */
  initializeWorker() {
    const queue = queueManager.getQueue('nano-banana-generation');
    
    queue.registerWorker('nano-banana-generate', async (job) => {
      const { params, userId } = job.data;
      return await this.processGeneration(params, userId);
    });
  }

  /**
   * Generate image with Nano-Banana (Gemini)
   * @param {Object} params - Generation parameters
   * @param {string} userId - User ID (optional for now)
   * @param {boolean} async - Use async queue processing
   */
  async generate(params, userId = null, async = false) {
    try {
      const { prompt, input_image, style, aspectRatio } = params;
      
      // Validate required parameters
      if (!prompt) {
        throw new Error('Prompt is required for Nano-Banana generation');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(params);
      const cached = await this.getCachedResult(cacheKey);
      
      if (cached) {
        logger.info('Returning cached Nano-Banana result', { cacheKey });
        return cached;
      }

      // Check user credits if authenticated
      const modelId = 'nano-banana';
      const requiredCredits = getModelCredits(modelId);
      
      if (userId) {
        const creditCheck = await this.checkUserCredits(userId, requiredCredits);
        
        if (!creditCheck.canAfford) {
          throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${creditCheck.available}`);
        }
      } else {
        logger.warn('Processing Nano-Banana without authentication - testing mode');
      }

      // If async, add to queue
      if (async) {
        const queue = queueManager.getQueue('nano-banana-generation');
        const job = await queue.add('nano-banana-generate', {
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
    const modelId = 'nano-banana';
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
      // Build prompt with style and aspect ratio information using standardized logic
      let fullPrompt = prompt;
      
      // Add style if provided
      if (style && style !== 'none') {
        fullPrompt = `${fullPrompt}, ${style} style`;
      }
      
      // Note: Gemini 2.5 Flash Image always generates 1024x1024 images
      // AspectRatio parameter is ignored by the model, so we don't add it to prompt
      if (aspectRatio && aspectRatio !== 'match') {
        logger.info('Nano-Banana aspect ratio requested (but model generates 1024x1024)', {
          original: aspectRatio,
          note: 'Gemini 2.5 Flash always generates square 1024x1024 images'
        });
      }

      let contentPrompt;
      
      // Handle both text-to-image and image-to-image
      if (input_image) {
        // Image-to-image generation
        logger.info('Processing image-to-image with Nano-Banana');
        
        // Process input image
        let imageBase64 = input_image;
        
        // If it's a URL, download it first
        if (input_image.startsWith('http')) {
          const response = await axios.get(input_image, {
            responseType: 'arraybuffer'
          });
          imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        } else {
          // Clean base64 if it has data URL prefix
          imageBase64 = input_image.replace(/^data:image\/\w+;base64,/, '');
        }

        contentPrompt = [
          { 
            text: `I want you to completely recreate this image with the following modifications: ${fullPrompt}. Do NOT just copy the original image. You must make significant visual changes, alterations, and creative transformations. Change colors, lighting, style, mood, or artistic approach as specified. Generate a distinctly different version that clearly shows the requested transformation.` 
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64
            }
          }
        ];
      } else {
        // Text-to-image generation
        logger.info('Processing text-to-image with Nano-Banana');
        contentPrompt = [
          { 
            text: `Create a picture: ${fullPrompt}` 
          }
        ];
      }

      logger.info('Calling Gemini API for image generation', {
        hasInputImage: !!input_image,
        aspectRatio
      });

      // Generate with Gemini
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: contentPrompt
      });

      // Extract generated image from response
      let generatedImageUrl = null;
      let generatedImageBase64 = null;

      // Check for image in response
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              generatedImageBase64 = part.inlineData.data;
              break;
            }
          }
        }
      }

      if (!generatedImageBase64) {
        throw new Error('No image generated by Nano-Banana');
      }

      // Upload generated image to ImgBB
      generatedImageUrl = await this.uploadImage(generatedImageBase64);

      // Deduct credits if user is authenticated
      if (userId) {
        await this.deductCredits(userId, requiredCredits, `Nano-Banana generation`);

        // Gemini 2.5 Flash always generates 1024x1024 images regardless of requested aspect ratio
        // Save image with actual dimensions
        const image = await this.saveImage({
          userId,
          generationId: generation?.id,
          url: generatedImageUrl,
          prompt,
          model: modelId,
          style,
          width: 1024,  // Gemini always generates 1024x1024
          height: 1024  // Gemini always generates 1024x1024
        });

        // Update generation status
        if (generation) {
          await this.updateGenerationStatus(generation.id, 'COMPLETED');
        }
      }

      // Cache result
      const result = {
        success: true,
        url: generatedImageUrl,
        model: modelId,
        creditsUsed: requiredCredits,
        generationId: generation?.id
      };
      
      const cacheKey = this.generateCacheKey(params);
      await this.cacheResult(cacheKey, result, 3600); // Cache for 1 hour

      return result;
    } catch (error) {
      // Update generation status to failed
      if (generation) {
        await this.updateGenerationStatus(generation.id, 'FAILED', {
          error: error.message
        });
      }
      
      logger.error('Nano-Banana generation failed', error);
      throw error;
    }
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
          ...formData.getHeaders()
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
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  /**
   * Get job status from queue
   */
  async getJobStatus(jobId) {
    const queue = queueManager.getQueue('nano-banana-generation');
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
const nanoBananaService = new NanoBananaService();
export default nanoBananaService;