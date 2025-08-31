import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY || 'b5cfe077850a194e434914eedd7111d5';
const MIDJOURNEY_API_URL = 'https://api.kie.ai/api/v1/mj';

/**
 * Generate image-to-image with Midjourney
 * Refactored to use unified services
 */
export const generateImageToImage = asyncHandler(async (req, res) => {
  console.log('🚨 MIDJOURNEY CONTROLLER REACHED - Request received');
  
  const { 
    prompt, 
    negative_prompt, 
    input_image, 
    creative_strength = 0.5,
    control_strength = 0.4,
    aspectRatio = '1:1' 
  } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  const modelId = 'midjourney';
  let generation = null;
  let creditsUsed = 0;

  try {
    // Check and deduct credits using unified service
    const { user, creditsUsed: credits } = await checkAndDeductCredits(userId, modelId);
    creditsUsed = credits;

    // Create generation record
    generation = await createGeneration(userId, {
      prompt,
      negativePrompt: negative_prompt,
      model: modelId,
      status: 'PENDING'
    });

    console.log('Midjourney image-to-image request:', { 
      hasPrompt: !!prompt, 
      hasNegative: !!negative_prompt,
      hasImage: !!input_image,
      creative_strength,
      control_strength,
      aspectRatio
    });

    // Process image URL (upload to ImgBB if base64)
    const imageUrl = await uploadImageToImgBB(input_image);

    // Prepare Midjourney request
    const requestBody = {
      prompt: `${imageUrl} ${prompt}`,
      model: 'mj-v6',
      aspectRatio: mapAspectRatio(aspectRatio),
      version: 'v6',
      chaos: Math.round(creative_strength * 100),
      quality: 1,
      stylize: Math.round((1 - control_strength) * 1000)
    };

    console.log('Midjourney API request:', requestBody);

    // Make API request
    const response = await axios.post(`${MIDJOURNEY_API_URL}/imagine`, requestBody, {
      headers: {
        'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Midjourney API response:', JSON.stringify(response.data, null, 2));

    // Poll for result
    if (response.data?.success && response.data?.messageId) {
      const result = await pollForMidjourneyResult(response.data.messageId);
      
      if (result.imageUrl) {
        // Update generation status
        await completeGeneration(generation.id);
        
        // Try to save the generated image
        try {
          await saveGeneratedImage(
            { url: result.imageUrl, width: 1024, height: 1024 },
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
          image: result.imageUrl,
          thumbnailUrl: result.imageUrl,
          credits: {
            used: creditsUsed,
            remaining: user.totalCredits - creditsUsed
          },
          model: modelId
        });
      } else {
        throw new Error('No image URL in Midjourney result');
      }
    } else {
      throw new Error('Failed to initiate Midjourney generation');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Midjourney', 'generateImageToImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Midjourney generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Midjourney');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Generate text-to-image with Midjourney
 * Refactored to use unified services
 */
export const generateImage = asyncHandler(async (req, res) => {
  const { prompt, aspectRatio = '1:1', style } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt) {
    return sendBadRequest(res, 'Prompt is required');
  }

  const modelId = 'midjourney';
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

    console.log('Midjourney text-to-image request:', { 
      prompt,
      aspectRatio,
      style
    });

    // Prepare Midjourney request
    const requestBody = {
      prompt: style ? `${prompt} --style ${style}` : prompt,
      model: 'mj-v6',
      aspectRatio: mapAspectRatio(aspectRatio),
      version: 'v6',
      quality: 1
    };

    // Make API request
    const response = await axios.post(`${MIDJOURNEY_API_URL}/imagine`, requestBody, {
      headers: {
        'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Midjourney API response:', JSON.stringify(response.data, null, 2));

    // Poll for result
    if (response.data?.success && response.data?.messageId) {
      const result = await pollForMidjourneyResult(response.data.messageId);
      
      if (result.imageUrl) {
        // Update generation status
        await completeGeneration(generation.id);
        
        // Try to save the generated image
        try {
          await saveGeneratedImage(
            { url: result.imageUrl, width: 1024, height: 1024 },
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
          image: result.imageUrl,
          thumbnailUrl: result.imageUrl,
          credits: {
            used: creditsUsed,
            remaining: user.totalCredits - creditsUsed
          },
          model: modelId
        });
      } else {
        throw new Error('No image URL in Midjourney result');
      }
    } else {
      throw new Error('Failed to initiate Midjourney generation');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Midjourney', 'generateImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Midjourney generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Midjourney');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Helper function to upload image to ImgBB
 */
async function uploadImageToImgBB(input_image) {
  // If already a URL, return it
  if (input_image.startsWith('http')) {
    return input_image;
  }

  const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd5872cba0cfa53b44580045b14466f9c';
  
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
    console.log('Image uploaded to ImgBB:', imgbbResponse.data.data.url);
    return imgbbResponse.data.data.url;
  } else {
    throw new Error('Failed to upload image to ImgBB');
  }
}

/**
 * Helper function to map aspect ratios
 */
function mapAspectRatio(aspectRatio) {
  const ratioMap = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4',
    'match': '1:1'
  };
  return ratioMap[aspectRatio] || '1:1';
}

/**
 * Poll for Midjourney result
 */
async function pollForMidjourneyResult(messageId) {
  const maxAttempts = 60;
  const interval = 3000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, interval));
    
    try {
      const response = await axios.get(`${MIDJOURNEY_API_URL}/message/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`
        }
      });
      
      console.log(`Polling attempt ${attempt}:`, response.data?.status);
      
      if (response.data?.status === 'completed' && response.data?.imageUrl) {
        return { imageUrl: response.data.imageUrl };
      } else if (response.data?.status === 'failed') {
        throw new Error(`Midjourney generation failed: ${response.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`Polling attempt ${attempt} failed, retrying...`);
    }
  }
  
  throw new Error('Midjourney generation timed out');
}