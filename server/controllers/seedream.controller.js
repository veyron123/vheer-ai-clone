import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { logAIServiceError, getUserFriendlyAIError } from '../utils/aiServiceErrors.js';

// FAL.ai Seedream V4 Configuration
const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_URL = 'https://fal.run/fal-ai/bytedance/seedream/v4/edit';

console.log('🔑 FAL_API_KEY loaded:', FAL_API_KEY ? 'YES (length: ' + FAL_API_KEY.length + ')' : 'NO - MISSING!');

/**
 * Generate image with FAL.ai Seedream V4
 * Supports multi-image editing with advanced AI
 */
export const generateImage = asyncHandler(async (req, res) => {
  const { prompt, input_image, style, model, aspectRatio, num_images = 1 } = req.body;
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

  // Check FAL API key
  if (!FAL_API_KEY) {
    console.error('❌ FAL_API_KEY not configured');
    return sendServerError(res, 'Seedream service not available', { error: 'API key missing' });
  }

  const modelId = model || 'seedream-v4';
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

    console.log(`🎨 Starting Seedream V4 generation for user ${userId}`);

    // Generate with FAL.ai Seedream V4
    const result = await generateWithFALSeedream(prompt, input_image, style, aspectRatio, num_images, req);
    
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
        console.log('✅ Image saved to user gallery');
      } catch (saveError) {
        console.log('⚠️ Image not saved:', saveError.message);
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
        model: modelId,
        provider: 'FAL.ai',
        seed: result.seed
      };
      
      const finalResponse = {
        success: true,
        ...response
      };
      console.log('✅ Seedream V4 generation completed successfully');
      return res.status(200).json(finalResponse);
    } else {
      throw new Error(result.error || 'Seedream V4 generation failed');
    }

  } catch (error) {
    // Log the error
    console.error('❌ Error caught in seedream.controller:', error.message);
    console.error('❌ Stack trace:', error.stack);
    logAIServiceError(error, 'Seedream V4', 'generateImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Seedream V4 generation failed');
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
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Seedream V4');
    return sendServerError(res, userFriendlyMessage, {
      details: error.response?.data || error.message
    });
  }
});

/**
 * Generate image using FAL.ai Seedream V4 API
 */
async function generateWithFALSeedream(prompt, input_image, style, aspectRatio, num_images, req) {
  try {
    console.log('🚀 Starting FAL.ai Seedream V4 generation');
    
    // Process image URL - convert base64 to URL if needed
    const imageUrls = await processImageInputs([input_image]);
    
    // Map aspectRatio to FAL image_size format
    const getImageSize = (aspectRatio) => {
      const mapping = {
        '1:1': 'square_hd',
        'square': 'square_hd',
        '3:4': 'portrait_4_3',
        'portrait': 'portrait_4_3', 
        '9:16': 'portrait_16_9',
        '4:3': 'landscape_4_3',
        'landscape': 'landscape_4_3',
        'landscape_4_3': 'landscape_4_3',
        '16:9': 'landscape_16_9',
        'match': 'square_hd' // Default for match
      };
      return mapping[aspectRatio] || 'square_hd';
    };

    // Combine style with prompt if provided
    const fullPrompt = style && style !== 'none' && style !== 'custom'
      ? `Transform this image into ${style} style. ${prompt}`
      : prompt;

    // Prepare FAL.ai Seedream V4 request
    const requestBody = {
      prompt: fullPrompt,
      image_urls: imageUrls,
      image_size: getImageSize(aspectRatio),
      num_images: parseInt(num_images) || 1,
      sync_mode: false // Use async for better UX
    };

    console.log('🔍 [FAL Seedream] Full request to FAL.ai API:', {
      url: FAL_API_URL,
      body: {
        ...requestBody,
        image_urls: ['IMAGE_URL_PRESENT']
      }
    });

    // Make request to FAL.ai API
    const response = await axios.post(FAL_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${FAL_API_KEY}`
      },
      timeout: 120000 // 2 minute timeout
    });

    console.log('📋 [FAL Seedream] API response:', response.data);

    // Check if we have a request ID for polling
    if (response.data?.request_id) {
      const requestId = response.data.request_id;
      console.log('🔄 [FAL Seedream] Got request ID, starting polling:', requestId);
      
      // Poll for result
      const result = await pollForFALResult(requestId, req);
      return result;
    } 
    // Handle direct result (sync mode)
    else if (response.data?.images?.length > 0) {
      const imageUrl = response.data.images[0].url;
      console.log('✅ [FAL Seedream] Direct generation successful:', imageUrl);
      
      return {
        success: true,
        image: imageUrl,
        thumbnailUrl: imageUrl,
        seed: response.data.seed
      };
    } else {
      const errorMsg = response.data?.error || 'No images generated';
      console.error('❌ [FAL Seedream] API error response:', response.data);
      throw new Error(`FAL Seedream API error: ${errorMsg}`);
    }
  } catch (error) {
    console.error('❌ FAL Seedream generation error:', error.message);
    if (error.response?.data) {
      console.error('❌ FAL API response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Process image inputs - handle base64 and URLs
 */
async function processImageInputs(imageInputs) {
  const processedUrls = [];
  
  for (const imageInput of imageInputs) {
    if (imageInput.startsWith('data:image/')) {
      // Convert base64 to URL using uploadBase64ToCloudinary or similar
      const publicUrl = await uploadBase64ToCloudinary(imageInput);
      processedUrls.push(publicUrl);
    } else {
      // Assume it's already a URL
      processedUrls.push(imageInput);
    }
  }
  
  return processedUrls;
}

/**
 * Upload base64 image to Cloudinary for FAL.ai compatibility
 */
async function uploadBase64ToCloudinary(base64Data) {
  const { v2: cloudinary } = await import('cloudinary');
  
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured for Seedream service');
  }

  console.log('📤 [FAL Seedream] Converting base64 to public URL...');
  
  // Cloudinary can accept base64 data directly
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'vheer-ai/seedream/inputs',
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto'
  });
  
  if (result?.secure_url) {
    console.log('✅ [FAL Seedream] Base64 uploaded successfully:', result.secure_url);
    return result.secure_url;
  } else {
    throw new Error('Cloudinary upload failed - no secure_url in response');
  }
}

/**
 * Poll for FAL.ai task result
 */
async function pollForFALResult(requestId, req = null) {
  const maxAttempts = 60; // 2 minutes max
  const initialDelay = 3000; // 3 seconds
  
  console.log(`🔄 [FAL Seedream] Starting polling for request: ${requestId}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check if request was cancelled
    if (req && req.aborted) {
      throw new Error('Request was cancelled during polling');
    }
    
    try {
      // Progressive delay: 3s -> 5s -> 10s
      const delayMs = attempt < 5 ? initialDelay : 
                      attempt < 15 ? 5000 : 
                      10000;
      
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      console.log(`🔍 [FAL Seedream] Polling attempt ${attempt + 1}/${maxAttempts}`);
      
      // Check task status
      const statusResponse = await axios.get(`https://fal.run/fal-ai/bytedance/seedream/v4/edit/requests/${requestId}/status`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`
        },
        timeout: 10000
      });

      console.log(`📊 [FAL Seedream] Status response:`, statusResponse.data);

      const status = statusResponse.data.status;
      
      if (status === 'COMPLETED') {
        // Get the final result
        const resultResponse = await axios.get(`https://fal.run/fal-ai/bytedance/seedream/v4/edit/requests/${requestId}`, {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
        });
        
        const resultData = resultResponse.data;
        
        if (resultData.images && resultData.images.length > 0) {
          const imageUrl = resultData.images[0].url;
          console.log('✅ [FAL Seedream] Generation successful:', imageUrl);
          
          return {
            success: true,
            image: imageUrl,
            thumbnailUrl: imageUrl,
            seed: resultData.seed
          };
        } else {
          throw new Error('No images in completed result');
        }
      } else if (status === 'FAILED') {
        const error = statusResponse.data.error || 'Task failed';
        console.error('❌ [FAL Seedream] Task failed:', error);
        throw new Error(`Generation failed: ${error}`);
      } else if (['IN_QUEUE', 'IN_PROGRESS'].includes(status)) {
        console.log(`🔄 [FAL Seedream] Task status: ${status}, continuing...`);
        continue;
      } else {
        console.log(`⏳ [FAL Seedream] Unknown task status: ${status}, continuing...`);
        continue;
      }
    } catch (error) {
      console.error(`❌ [FAL Seedream] Polling attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Continue polling on transient errors
      continue;
    }
  }

  throw new Error('FAL Seedream task timeout - exceeded maximum polling attempts');
}

// Export functions for route setup
export { generateImage as seedreamGenerate };