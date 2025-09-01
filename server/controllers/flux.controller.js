import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { logAIServiceError, getUserFriendlyAIError } from '../utils/aiServiceErrors.js';

const FLUX_API_KEY = process.env.FLUX_API_KEY;
console.log('🔑 FLUX_API_KEY loaded:', FLUX_API_KEY ? 'YES (length: ' + FLUX_API_KEY.length + ')' : 'NO - MISSING!');

// Current bfl.ai endpoints (ACTIVE)
const FLUX_KONTEXT_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';
const FLUX_STATUS_URL = 'https://api.bfl.ai/v1/get_result';

/**
 * Generate image with Flux
 * Refactored to use unified services
 */
export const generateImage = asyncHandler(async (req, res) => {
  const { prompt, input_image, style, model, aspectRatio } = req.body;
  const userId = req.user?.id;
  
  // Check if request was aborted
  if (req.aborted) {
    console.log('Request was aborted before processing');
    return sendBadRequest(res, 'Request cancelled', { cancelled: true });
  }

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  const modelId = model || 'flux-pro';
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

    // Determine steps based on model
    const steps = model === 'flux-max' ? 50 : 28;
    console.log(`Using ${modelId} model with ${steps} steps`);

    // Prepare request body
    const requestBody = {
      prompt: prompt,
      input_image: input_image.replace(/^data:image\/[a-z]+;base64,/, ''),
      aspect_ratio: aspectRatio === 'match' ? '1:1' : (aspectRatio || '1:1'),
      output_format: 'jpeg'
    };
    
    // Determine endpoint
    const apiUrl = model === 'flux-max' 
      ? 'https://api.bfl.ai/v1/flux-kontext-max' 
      : 'https://api.bfl.ai/v1/flux-kontext-pro';
    
    // Make API request
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flux API response:', JSON.stringify(response.data, null, 2));

    if (!response.data?.id) {
      throw new Error('No request ID received from bfl.ai API');
    }

    // Poll for result
    const result = await pollForBflResult(response.data.id, response.data.polling_url, req);
    
    if (result.success) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image and get Cloudinary URLs
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: result.image, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      // Send success response with Cloudinary URLs if available
      console.log('📤 Sending success response to client...');
      const response = {
        image: savedImageData?.url || result.image,
        thumbnailUrl: savedImageData?.thumbnailUrl || result.thumbnailUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      };
      console.log('📦 Response data prepared:', { ...response, image: 'URL_PRESENT', thumbnailUrl: 'URL_PRESENT' });
      console.log('🚀 About to send success response...');
      // Send response in the format frontend expects
      const finalResponse = {
        success: true,
        ...response
      };
      console.log('✅ Sending response in correct format');
      return res.status(200).json(finalResponse);
    } else {
      throw new Error(result.error || 'Generation failed');
    }

  } catch (error) {
    // Log the error
    console.error('❌ Error caught in flux.controller:', error.message);
    console.error('❌ Stack trace:', error.stack);
    logAIServiceError(error, 'Flux', 'generateImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Flux generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Check for specific error types
    if (error.message.includes('Request was cancelled') || req.aborted) {
      return sendBadRequest(res, 'Request cancelled', { cancelled: true });
    }
    
    if (error.statusCode === 400) {
      return sendBadRequest(res, error.message, error.details);
    }
    
    if (error.statusCode === 401) {
      return sendUnauthorized(res, error.message);
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Flux');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Poll for generation result from bfl.ai
 * This remains mostly the same as it's API-specific
 */
async function pollForBflResult(requestId, pollingUrl, req = null) {
  const maxAttempts = 60;
  const baseInterval = 2000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check if request was cancelled
    if (req && req.aborted) {
      throw new Error('Request was cancelled during polling');
    }
    
    try {
      // Use adaptive polling intervals
      const interval = attempt < 5 ? baseInterval : 
                      attempt < 15 ? baseInterval * 1.5 : 
                      baseInterval * 2;
      
      await new Promise(resolve => setTimeout(resolve, interval));
      
      const statusResponse = await axios.get(FLUX_STATUS_URL, {
        params: { id: requestId },
        headers: {
          'accept': 'application/json',
          'x-key': FLUX_API_KEY
        }
      });
      
      console.log(`Polling attempt ${attempt}: ${statusResponse.data.status}`);
      console.log('Full status response:', JSON.stringify(statusResponse.data, null, 2));
      
      if (statusResponse.data.status === 'Ready') {
        const imageUrl = statusResponse.data.result?.sample;
        
        if (!imageUrl) {
          console.error('No image URL in result:', statusResponse.data);
          throw new Error('No image generated');
        }
        
        console.log('✅ Flux generation successful, image URL:', imageUrl);
        
        return {
          success: true,
          image: imageUrl,
          thumbnailUrl: imageUrl
        };
      } else if (statusResponse.data.status === 'Error') {
        console.error('❌ Flux generation failed:', statusResponse.data.error);
        throw new Error(`Generation failed: ${statusResponse.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`Request ${requestId} not found yet, continuing...`);
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Generation timed out after maximum attempts');
}

// Generate batch images (if needed)
export const generateBatch = asyncHandler(async (req, res) => {
  const { prompts, model, style } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }
  
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return sendBadRequest(res, 'Prompts array is required');
  }
  
  const modelId = model || 'flux-pro';
  const results = [];
  const errors = [];
  
  for (const prompt of prompts) {
    try {
      // Process each prompt
      const result = await generateSingleImage(userId, prompt, modelId, style);
      results.push(result);
    } catch (error) {
      errors.push({ prompt, error: error.message });
    }
  }
  
  return sendSuccess(res, {
    successful: results,
    failed: errors,
    total: prompts.length,
    successCount: results.length,
    failCount: errors.length
  }, 'Batch generation completed');
});

// Helper function for single image generation
async function generateSingleImage(userId, prompt, modelId, style) {
  // Implementation would be similar to generateImage but simplified
  // This is just a placeholder for the pattern
  return { prompt, image: 'generated-url' };
}