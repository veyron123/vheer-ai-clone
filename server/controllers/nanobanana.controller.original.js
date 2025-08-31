import nanoBananaService from '../services/NanoBananaService.js';
import logger from '../utils/logger.js';

/**
 * Generate image with Nano-Banana (text-to-image)
 */
export const generateImage = async (req, res) => {
  try {
    const { prompt, style, aspectRatio } = req.body;
    const userId = req.user?.id; // User from auth middleware
    
    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }
    
    logger.info('Nano-Banana text-to-image generation request', {
      userId,
      hasPrompt: !!prompt,
      style,
      aspectRatio
    });
    
    // Generate image
    const result = await nanoBananaService.generate({
      prompt,
      style,
      aspectRatio
    }, userId);
    
    // Return result
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Nano-Banana text-to-image generation failed:', error);
    
    // Check for specific error types
    if (error.message?.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        error: error.message,
        code: 'INSUFFICIENT_CREDITS'
      });
    }
    
    if (error.message?.includes('Authentication required')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this service'
      });
    }

    // Check for API quota exceeded
    if (error.message?.includes('You exceeded your current quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'API quota exceeded. Please try again later or check your billing.',
        code: 'QUOTA_EXCEEDED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image with Nano-Banana'
    });
  }
};

/**
 * Generate image-to-image with Nano-Banana
 */
export const generateImageToImage = async (req, res) => {
  try {
    const { prompt, input_image, style, aspectRatio } = req.body;
    const userId = req.user?.id; // User from auth middleware
    
    // Validate required parameters
    if (!prompt || !input_image) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and input image are required'
      });
    }
    
    logger.info('Nano-Banana image-to-image generation request', {
      userId,
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      style,
      aspectRatio
    });
    
    // Generate image
    const result = await nanoBananaService.generate({
      prompt,
      input_image,
      style,
      aspectRatio
    }, userId);
    
    // Return result
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Nano-Banana image-to-image generation failed:', error);
    
    // Check for specific error types
    if (error.message?.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        error: error.message,
        code: 'INSUFFICIENT_CREDITS'
      });
    }
    
    if (error.message?.includes('Authentication required')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this service'
      });
    }

    // Check for API quota exceeded
    if (error.message?.includes('You exceeded your current quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'API quota exceeded. Please try again later or check your billing.',
        code: 'QUOTA_EXCEEDED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image with Nano-Banana'
    });
  }
};