import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_TURBO_URL = 'https://api.kie.ai/api/v1/qwen2vl-flux/generate';
const QWEN_ULTRA_URL = 'https://api.kie.ai/api/v1/qwen2vl-flux-ultra/generate';

/**
 * Generate image with Qwen Turbo
 * Refactored to use unified services
 */
export const generateImageTurbo = asyncHandler(async (req, res) => {
  const { prompt, input_image, style, aspectRatio = '1:1' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  const modelId = 'qwen-turbo';
  let generation = null;
  let creditsUsed = 0;

  try {
    // Check and deduct credits using unified service
    const { user, creditsUsed: credits } = await checkAndDeductCredits(userId, modelId);
    creditsUsed = credits;

    // Create generation record
    generation = await createGeneration(userId, {
      prompt,
      model: modelId,
      style,
      status: 'PENDING'
    });

    console.log('Qwen Turbo generation request:', {
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      style,
      aspectRatio
    });

    // Process image URL
    const imageUrl = await processImageUrl(input_image);

    // Prepare request body
    const requestBody = {
      prompt,
      inputImage: imageUrl,
      style: style || 'default',
      aspectRatio: aspectRatio || '1:1',
      enableTranslation: true,
      outputFormat: 'jpeg'
    };

    // Make API request
    const response = await axios.post(QWEN_TURBO_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Qwen Turbo API response:', JSON.stringify(response.data, null, 2));

    if (response.data?.success && response.data?.data?.url) {
      const imageUrl = response.data.data.url;
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      // Send success response
      return sendSuccess(res, {
        success: true,
        image: imageUrl,
        thumbnailUrl: imageUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      });
    } else {
      throw new Error('Unexpected response structure from Qwen API');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Qwen', 'generateImageTurbo');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Qwen generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Qwen');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Generate image with Qwen Ultra
 * Refactored to use unified services
 */
export const generateImageUltra = asyncHandler(async (req, res) => {
  const { prompt, input_image, style, aspectRatio = '1:1' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  const modelId = 'qwen-ultra';
  let generation = null;
  let creditsUsed = 0;

  try {
    // Check and deduct credits using unified service
    const { user, creditsUsed: credits } = await checkAndDeductCredits(userId, modelId);
    creditsUsed = credits;

    // Create generation record
    generation = await createGeneration(userId, {
      prompt,
      model: modelId,
      style,
      status: 'PENDING'
    });

    console.log('Qwen Ultra generation request:', {
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      style,
      aspectRatio
    });

    // Process image URL
    const imageUrl = await processImageUrl(input_image);

    // Prepare request body
    const requestBody = {
      prompt,
      inputImage: imageUrl,
      style: style || 'default',
      aspectRatio: aspectRatio || '1:1',
      enableTranslation: true,
      outputFormat: 'jpeg',
      enhanceQuality: true
    };

    // Make API request
    const response = await axios.post(QWEN_ULTRA_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Qwen Ultra API response:', JSON.stringify(response.data, null, 2));

    if (response.data?.success && response.data?.data?.url) {
      const imageUrl = response.data.data.url;
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      // Send success response
      return sendSuccess(res, {
        success: true,
        image: imageUrl,
        thumbnailUrl: imageUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      });
    } else {
      throw new Error('Unexpected response structure from Qwen API');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Qwen', 'generateImageUltra');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Qwen generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Qwen');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Helper function to process image URL
 */
async function processImageUrl(input_image) {
  // If it's already a URL, return it
  if (input_image.startsWith('http')) {
    return input_image;
  }

  // If it's base64, try to upload it to ImgBB
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  if (!IMGBB_API_KEY) {
    console.warn('ImgBB API key not configured, using base64 directly');
    return input_image;
  }

  try {
    // Remove data:image prefix if present
    const cleanBase64 = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);
    
    const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (imgbbResponse.data?.success && imgbbResponse.data?.data?.url) {
      console.log('Image uploaded to ImgBB successfully');
      return imgbbResponse.data.data.url;
    }
  } catch (uploadError) {
    console.error('Failed to upload to ImgBB:', uploadError.message);
  }

  // Fallback to base64
  return input_image;
}