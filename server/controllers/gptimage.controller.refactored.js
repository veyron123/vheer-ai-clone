import gptImageService from '../services/GPTImageService.js';
import logger from '../utils/logger.js';

/**
 * GPT Image Controller - Refactored
 * Uses GPTImageService for all business logic
 */

/**
 * Generate image with GPT Image
 */
export const generateImage = async (req, res) => {
  try {
    const { 
      prompt, 
      input_image, 
      style, 
      aspectRatio = '1:1',
      async = false 
    } = req.body;
    
    const userId = req.user?.id;

    // Log request
    logger.info('GPT Image generation request', {
      userId,
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      aspectRatio,
      async
    });

    // For GPT Image, both prompt and input_image are required
    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Both prompt and input image are required for GPT Image'
      });
    }

    // Call service (userId is optional for testing)
    const result = await gptImageService.generate(
      { prompt, input_image, style, aspectRatio },
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
    logger.error('GPT Image controller error', error);
    
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

    const status = await gptImageService.getJobStatus(jobId);

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
 * Check model info
 */
export const checkModel = async (req, res) => {
  try {
    // GPT Image has a single model
    const modelInfo = {
      model: 'gpt-image',
      available: true,
      credits: 5,
      description: 'GPT Image - AI-powered image transformation',
      supportedSizes: ['1:1', '3:2', '2:3'],
      requiresInputImage: true
    };

    res.json(modelInfo);
  } catch (error) {
    logger.error('Check model error', error);
    res.status(500).json({
      error: 'Failed to check model'
    });
  }
};