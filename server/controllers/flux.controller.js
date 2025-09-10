import axios from 'axios';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { logAIServiceError, getUserFriendlyAIError } from '../utils/aiServiceErrors.js';

// Provider configuration
const FLUX_PROVIDER = process.env.FLUX_PROVIDER || 'KIE';
const FLUX_API_KEY = process.env.FLUX_API_KEY;
const KIE_API_KEY = process.env.KIE_API_KEY || '2286be72f9c75b12557518051d46c551';
const KIE_API_URL = 'https://api.kie.ai/api/v1/flux/kontext';

console.log('🔑 FLUX_API_KEY loaded:', FLUX_API_KEY ? 'YES (length: ' + FLUX_API_KEY.length + ')' : 'NO - MISSING!');
console.log('🔑 KIE_API_KEY loaded:', KIE_API_KEY ? 'YES (length: ' + KIE_API_KEY.length + ')' : 'NO - MISSING!');
console.log('🔧 FLUX_PROVIDER:', FLUX_PROVIDER);

// BFL.ai endpoints
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

    console.log(`🔧 Using ${FLUX_PROVIDER} provider for ${modelId} model`);

    let result;
    
    if (FLUX_PROVIDER === 'KIE') {
      // Use KIE API
      result = await generateWithKIE(prompt, input_image, style, aspectRatio, modelId, req);
    } else {
      // Use BFL.ai API (default)
      result = await generateWithBFL(prompt, input_image, style, aspectRatio, modelId, req);
    }
    
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
        model: modelId,
        provider: FLUX_PROVIDER
      };
      console.log('📦 Response data prepared:', { ...response, image: 'URL_PRESENT', thumbnailUrl: 'URL_PRESENT' });
      console.log('🚀 About to send success response...');
      
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
 * Generate image using BFL.ai API
 */
async function generateWithBFL(prompt, input_image, style, aspectRatio, modelId, req) {
  try {
    // Determine steps based on model
    const steps = modelId === 'flux-max' ? 50 : 28;
    console.log(`Using BFL.ai ${modelId} model with ${steps} steps`);

    // Prepare request body
    const requestBody = {
      prompt: prompt,
      input_image: input_image.replace(/^data:image\/[a-z]+;base64,/, ''),
      aspect_ratio: aspectRatio === 'match' ? '1:1' : (aspectRatio || '1:1'),
      output_format: 'jpeg'
    };
    
    // Determine endpoint
    const apiUrl = modelId === 'flux-max' 
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
    
    console.log('BFL Flux API response:', JSON.stringify(response.data, null, 2));

    if (!response.data?.id) {
      throw new Error('No request ID received from bfl.ai API');
    }

    // Poll for result
    const result = await pollForBflResult(response.data.id, response.data.polling_url, req);
    
    return result;
  } catch (error) {
    console.error('❌ BFL generation error:', error.message);
    throw error;
  }
}

/**
 * Generate image using KIE API
 */
async function generateWithKIE(prompt, input_image, style, aspectRatio, modelId, req) {
  try {
    console.log('🎯 Starting KIE Flux generation');
    
    // Process image URL - convert base64 to public URL
    const imageUrl = await uploadBase64ToImgbb(input_image);
    
    // Map aspectRatio to KIE Flux Kontext API format
    const getAspectRatio = (aspectRatio) => {
      const mapping = {
        '1:1': '1:1',
        'square': '1:1',
        '3:4': '3:4',
        'portrait': '3:4', 
        '9:16': '9:16',
        '4:3': '4:3',
        'landscape': '16:9',
        'landscape_4_3': '4:3',
        '16:9': '16:9',
        '21:9': '21:9'
      };
      return mapping[aspectRatio] || '16:9';
    };

    // Combine style with prompt if provided
    const fullPrompt = style && style !== 'none' 
      ? `${prompt}, ${style} style`
      : prompt;

    // Prepare KIE Flux Kontext API request
    const requestBody = {
      prompt: fullPrompt,
      enableTranslation: true,
      uploadCn: false,
      inputImage: imageUrl,
      aspectRatio: getAspectRatio(aspectRatio),
      outputFormat: 'jpeg',
      promptUpsampling: false,
      model: modelId === 'flux-max' ? 'flux-kontext-max' : 'flux-kontext-pro',
      safetyTolerance: 2,
      watermark: null
    };

    console.log('🔍 [KIE FLUX] Full request to KIE Flux Kontext API:', {
      url: `${KIE_API_URL}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY.substring(0, 10)}...`
      },
      body: {
        ...requestBody,
        inputImage: 'IMAGE_URL_PRESENT'
      }
    });

    // Generate with KIE Flux Kontext API
    const response = await axios.post(`${KIE_API_URL}/generate`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      timeout: 60000 // Increased timeout for direct generation
    });

    console.log('📋 [KIE FLUX] Flux Kontext response:', response.data);

    // Check for Flux Kontext API response format
    if (response.data?.code === 200 && response.data?.data?.taskId) {
      const taskId = response.data.data.taskId;
      console.log('🔄 [KIE FLUX] Got taskId from Flux Kontext, starting polling:', taskId);
      
      // Poll for result using Flux Kontext format
      const result = await pollForKieFluxKontextResult(taskId, req);
      return result;
    } else {
      const errorMsg = response.data?.msg || response.data?.message || response.data?.error || 'Unknown KIE Flux Kontext API error';
      console.error('❌ [KIE FLUX] Flux Kontext API error response:', response.data);
      throw new Error(`KIE Flux Kontext API error: ${errorMsg}`);
    }
  } catch (error) {
    console.error('❌ KIE generation error:', error.message);
    if (error.response?.data) {
      console.error('❌ KIE API response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Upload base64 image to public URL with IMGBB primary, Cloudinary fallback
 * KIE API requires public HTTP URLs, not base64 data
 */
async function uploadBase64ToImgbb(base64Data) {
  // Try IMGBB first
  try {
    return await uploadToIMGBBFlux(base64Data);
  } catch (imgbbError) {
    console.warn('⚠️ [FLUX-IMGBB] Primary upload failed, trying Cloudinary fallback:', imgbbError.message);
    
    // Fallback to Cloudinary
    try {
      return await uploadToCloudinaryFluxFallback(base64Data);
    } catch (cloudinaryError) {
      console.error('❌ [FLUX-FALLBACK] Both IMGBB and Cloudinary failed');
      throw new Error(`Image upload failed. IMGBB: ${imgbbError.message}. Cloudinary: ${cloudinaryError.message}`);
    }
  }
}

/**
 * Primary IMGBB upload function for Flux
 */
async function uploadToIMGBBFlux(base64Data) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured');
  }

  console.log('📤 [FLUX-IMGBB] Converting base64 to public URL for KIE...');
  
  // Extract base64 content
  const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Upload to IMGBB
  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Content);
  
  const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 30000
  });
  
  if (response.data?.success && response.data?.data?.url) {
    const publicUrl = response.data.data.url;
    console.log('✅ [FLUX-IMGBB] Base64 uploaded successfully:', publicUrl);
    return publicUrl;
  } else {
    throw new Error('IMGBB upload failed - no URL in response');
  }
}

/**
 * Cloudinary fallback upload function for Flux
 */
async function uploadToCloudinaryFluxFallback(base64Data) {
  const { v2: cloudinary } = await import('cloudinary');
  
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured - cannot use fallback');
  }

  console.log('📤 [FLUX-CLOUDINARY] Fallback: Converting base64 to public URL...');
  
  // Cloudinary can accept base64 data directly
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'vheer-ai/temp',
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto'
  });
  
  if (result?.secure_url) {
    console.log('✅ [FLUX-CLOUDINARY] Fallback upload successful:', result.secure_url);
    return result.secure_url;
  } else {
    throw new Error('Cloudinary upload failed - no secure_url in response');
  }
}

/**
 * Poll for KIE Flux Kontext task result
 * Uses Flux Kontext API /record-info endpoint
 */
async function pollForKieFluxKontextResult(taskId, req = null) {
  const maxAttempts = 60;
  const initialDelay = 3000;
  
  console.log(`🔄 [KIE FLUX] Starting polling for Flux Kontext task: ${taskId}`);
  
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

      console.log(`🔍 [KIE FLUX] Flux Kontext polling attempt ${attempt + 1}/${maxAttempts}`);
      
      // Use Flux Kontext record-info endpoint
      const statusResponse = await axios.get(`${KIE_API_URL}/record-info`, {
        params: { taskId: taskId },
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        },
        timeout: 10000
      });

      console.log(`📊 [KIE FLUX] Flux Kontext status response:`, statusResponse.data);

      // Handle Flux Kontext API response format
      if (statusResponse.data?.code === 200 && statusResponse.data?.data) {
        const resultData = statusResponse.data.data;
        
        // Check successFlag (0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED)
        if (resultData.successFlag === 1 && resultData.response?.resultImageUrl) {
          const imageUrl = resultData.response.resultImageUrl;
          console.log('✅ [KIE FLUX] Flux Kontext generation successful:', imageUrl);
          
          return {
            success: true,
            image: imageUrl,
            thumbnailUrl: imageUrl
          };
        } else if (resultData.successFlag === 2) {
          const errorMsg = resultData.errorMessage || 'Task creation failed';
          console.error('❌ [KIE FLUX] Flux Kontext task creation failed:', errorMsg);
          throw new Error(`Task creation failed: ${errorMsg}`);
        } else if (resultData.successFlag === 3) {
          const errorMsg = resultData.errorMessage || 'Generation failed';
          console.error('❌ [KIE FLUX] Flux Kontext generation failed:', errorMsg);
          throw new Error(`Generation failed: ${errorMsg}`);
        } else if (resultData.successFlag === 0) {
          console.log(`🔄 [KIE FLUX] Flux Kontext task generating, continuing...`);
          continue;
        } else {
          console.log(`⏳ [KIE FLUX] Unknown successFlag: ${resultData.successFlag}, continuing...`);
          continue;
        }
      } else {
        // Handle API error
        const errorMsg = statusResponse.data?.msg || statusResponse.data?.message || 'Unknown Flux Kontext status response';
        console.error('❌ [KIE FLUX] Flux Kontext API error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`❌ [KIE FLUX] Flux Kontext polling attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Continue polling on transient errors
      continue;
    }
  }

  throw new Error('KIE Flux Kontext task timeout - exceeded maximum polling attempts');
}

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