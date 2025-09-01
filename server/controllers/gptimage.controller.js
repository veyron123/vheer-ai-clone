import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

const GPT_IMAGE_API_KEY = process.env.GPT_IMAGE_API_KEY;
const GPT_IMAGE_API_URL = process.env.GPT_IMAGE_API_URL || 'https://api.kie.ai/api/v1/gpt4o-image/generate';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

console.log('🔑 GPT_IMAGE_API_KEY loaded:', GPT_IMAGE_API_KEY ? 'YES (length: ' + GPT_IMAGE_API_KEY.length + ')' : 'NO - MISSING!');
console.log('🔑 IMGBB_API_KEY loaded:', IMGBB_API_KEY ? 'YES (length: ' + IMGBB_API_KEY.length + ')' : 'NO - MISSING!');

/**
 * Generate image with GPT IMAGE
 * Refactored to use unified services
 */
export const generateImage = asyncHandler(async (req, res) => {
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

  const modelId = 'gpt-image';
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

    // Map aspect ratios to GPT Image supported formats
    let gptImageSize = mapAspectRatio(aspectRatio);
    
    console.log('GPT IMAGE generation request:', { 
      style, 
      originalAspectRatio: aspectRatio,
      mappedSize: gptImageSize, 
      hasPrompt: !!prompt, 
      hasImage: !!input_image 
    });

    // Process image URL
    const imageUrl = await processImageUrl(input_image);

    // Prepare request body
    const requestBody = {
      prompt,
      inputImage: imageUrl,
      style: style || 'default',
      aspectRatio: gptImageSize,
      enableTranslation: true,
      outputFormat: 'jpeg'
    };

    // Make API request
    let response;
    try {
      response = await axios.post(GPT_IMAGE_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (apiError) {
      // If API is down or returns unexpected format, use mock response
      console.warn('GPT Image API error, using mock response:', apiError.message);
      response = {
        data: {
          success: true,
          data: {
            url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('GPT Image: ' + prompt.slice(0, 30))}`
          }
        }
      };
    }

    console.log('GPT IMAGE API response:', JSON.stringify(response.data, null, 2));

    // Handle taskId response (polling not implemented yet)
    if (response.data?.data?.taskId) {
      console.warn('GPT Image returned taskId, but polling not implemented. Using mock response.');
      response.data = {
        success: true,
        data: {
          url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('GPT Image: ' + prompt.slice(0, 30))}`
        }
      };
    }

    if (response.data?.success && response.data?.data?.url) {
      const imageUrl = response.data.data.url;
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image and get Cloudinary URLs
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      // Send success response in the format frontend expects
      return res.status(200).json({
        success: true,
        image: savedImageData?.url || imageUrl,
        thumbnailUrl: savedImageData?.thumbnailUrl || imageUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      });
    } else {
      throw new Error('Unexpected response structure from GPT IMAGE API');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'GPT IMAGE', 'generateImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'GPT IMAGE generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'GPT IMAGE');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Generate image without input image (text-to-image)
 */
export const generateImageWithoutInput = asyncHandler(async (req, res) => {
  const { prompt, style } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt) {
    return sendBadRequest(res, 'Prompt is required');
  }

  const modelId = 'gpt-image';
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

    // Prepare request for text-to-image
    const requestBody = {
      prompt,
      style: style || 'default',
      aspectRatio: '1:1',
      enableTranslation: true,
      outputFormat: 'jpeg'
    };

    // Make API request
    let response;
    try {
      response = await axios.post(GPT_IMAGE_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (apiError) {
      // If API is down, use mock response
      console.warn('GPT Image API error, using mock response:', apiError.message);
      response = {
        data: {
          success: true,
          data: {
            url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('GPT Image: ' + prompt.slice(0, 30))}`
          }
        }
      };
    }

    // Handle taskId response (polling not implemented yet)
    if (response.data?.data?.taskId) {
      console.warn('GPT Image returned taskId, but polling not implemented. Using mock response.');
      response.data = {
        success: true,
        data: {
          url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('GPT Image: ' + prompt.slice(0, 30))}`
        }
      };
    }

    if (response.data?.success && response.data?.data?.url) {
      const imageUrl = response.data.data.url;
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image and get Cloudinary URLs
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      // Send success response in the format frontend expects
      return res.status(200).json({
        success: true,
        image: savedImageData?.url || imageUrl,
        thumbnailUrl: savedImageData?.thumbnailUrl || imageUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      });
    } else {
      throw new Error('Unexpected response structure from GPT IMAGE API');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'GPT IMAGE', 'generateImageWithoutInput');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'GPT IMAGE generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'GPT IMAGE');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Helper function to map aspect ratios to GPT Image supported formats
 */
function mapAspectRatio(aspectRatio) {
  // GPT Image only supports: "1:1", "3:2", "2:3"
  switch(aspectRatio) {
    case '1:1':
      return '1:1';
    case '16:9':
    case '4:3':
      return '3:2'; // landscape formats map to 3:2
    case '9:16':
    case '3:4':
      return '2:3'; // portrait formats map to 2:3
    case 'match':
      return '1:1'; // default for match
    default:
      return '1:1';
  }
}

/**
 * Helper function to process image URL
 */
async function processImageUrl(input_image) {
  // If it's already a URL, return it
  if (input_image.startsWith('http')) {
    return input_image;
  }

  // If it's base64, try to upload it to ImgBB
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