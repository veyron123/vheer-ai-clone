import fluxService from '../services/FluxService.js';
import logger from '../utils/logger.js';

/**
 * Flux Controller - Refactored
 * Uses FluxService for all business logic
 */

/**
 * Generate image with Flux
 */
export const generateImage = async (req, res) => {
  try {
    const { 
      prompt, 
      input_image, 
      style, 
      model, 
      aspectRatio, 
      async = false 
    } = req.body;
    
    const userId = req.user?.id;

    // Log request
    logger.info('Flux generation request', {
      userId,
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      model,
      async
    });

    // Require authentication
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to generate images'
      });
    }

    // Call service
    const result = await fluxService.generate(
      { prompt, input_image, style, model, aspectRatio },
      userId,
      async
    );

    // Handle error from service
    if (result.error) {
      return res.status(400).json(result);
    }

    // Return success response
    res.json(result);
  } catch (error) {
    logger.error('Flux controller error', error);
    
    // Handle specific errors
    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: error.message
      });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Generation failed',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
};

/**
 * Get job status for async generation
 */
export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required'
      });
    }

    const status = await fluxService.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json(status);
  } catch (error) {
    logger.error('Get job status error', error);
    res.status(500).json({
      error: 'Failed to get job status'
    });
  }
};

/**
 * Check model availability and pricing
 */
export const checkModel = async (req, res) => {
  try {
    const { model = 'flux-pro' } = req.query;
    
    // This could be expanded to check actual API availability
    const models = {
      'flux-pro': {
        available: true,
        credits: 10,
        description: 'Flux Pro - High quality generation',
        maxResolution: '1344x1344'
      },
      'flux-max': {
        available: true,
        credits: 15,
        description: 'Flux Max - Maximum quality generation',
        maxResolution: '2048x2048'
      }
    };

    const modelInfo = models[model];
    
    if (!modelInfo) {
      return res.status(404).json({
        error: 'Model not found'
      });
    }

    res.json(modelInfo);
  } catch (error) {
    logger.error('Check model error', error);
    res.status(500).json({
      error: 'Failed to check model'
    });
  }
};