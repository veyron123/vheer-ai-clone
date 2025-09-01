import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';
import fetch from 'node-fetch';

// KIE API Configuration for Qwen
const KIE_API_KEY = process.env.KIE_API_KEY || '2286be72f9c75b12557518051d46c551';
const KIE_API_URL = 'https://api.kie.ai/api/v1/playground';

console.log('🔑 KIE API configured for Qwen:', {
  hasKey: !!KIE_API_KEY,
  keyLength: KIE_API_KEY?.length,
  apiUrl: KIE_API_URL
});

/**
 * Poll KIE API task status until completion
 */
async function pollTaskStatus(taskId, maxAttempts = 60, delayMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || 'Failed to query task status');
      }

      const { state, resultJson, failMsg } = result.data;
      
      console.log(`Task ${taskId} status:`, { state, hasResult: !!resultJson });

      // Check task state
      if (state === 'success') {
        const results = JSON.parse(resultJson || '{}');
        console.log('Task completed with results:', {
          hasResultUrls: !!results.resultUrls,
          urlCount: results.resultUrls?.length,
          firstUrl: results.resultUrls?.[0]?.substring(0, 50) + '...'
        });
        return {
          success: true,
          url: results.resultUrls?.[0] || null
        };
      } else if (state === 'fail') {
        throw new Error(failMsg || 'Task failed');
      }

      // Task is still processing, wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
      
      // On last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error('Task timeout - exceeded maximum polling attempts');
}

/**
 * Generate image with Qwen Image Edit using KIE API
 * Updated to use KIE.ai playground API
 */
export const generateImageTurbo = asyncHandler(async (req, res) => {
  const { prompt, input_image, style, aspectRatio = 'landscape_4_3', num_inference_steps = 30, guidance_scale = 4 } = req.body;
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

    // Prepare KIE API request body
    const requestBody = {
      model: 'qwen/image-edit',
      input: {
        prompt,
        image_url: imageUrl,
        image_size: aspectRatio,
        num_inference_steps,
        guidance_scale,
        enable_safety_checker: true,
        output_format: 'png',
        sync_mode: false
      }
    };

    console.log('Sending request to KIE API:', {
      url: `${KIE_API_URL}/createTask`,
      model: requestBody.model,
      prompt: requestBody.input.prompt,
      imageUrl: requestBody.input.image_url,
      fullRequestBody: JSON.stringify(requestBody, null, 2)
    });

    // Create task with KIE API
    const createTaskResponse = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!createTaskResponse.ok) {
      const errorData = await createTaskResponse.json().catch(() => ({}));
      console.log('🚨 KIE API Error Response (Turbo):', {
        status: createTaskResponse.status,
        statusText: createTaskResponse.statusText,
        errorData: JSON.stringify(errorData, null, 2),
        url: `${KIE_API_URL}/createTask`,
        requestBody: JSON.stringify(requestBody, null, 2)
      });
      throw new Error(errorData.message || `HTTP error! status: ${createTaskResponse.status}`);
    }

    const taskResult = await createTaskResponse.json();
    
    if (taskResult.code !== 200) {
      throw new Error(taskResult.message || 'Failed to create task');
    }

    const taskId = taskResult.data.taskId;
    console.log('Created KIE API task:', taskId);

    // Poll for task completion
    const result = await pollTaskStatus(taskId);

    if (result.success && result.url) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image and get Cloudinary URLs
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: result.url, width: 1024, height: 1024 },
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
        image: savedImageData?.url || result.url,
        thumbnailUrl: savedImageData?.thumbnailUrl || result.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: {
          provider: 'KIE API',
          model: 'qwen/image-edit'
        }
      });
    } else {
      throw new Error('Failed to generate image');
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
      details: error.message
    });
  }
});

/**
 * Generate image with Qwen Ultra using KIE API
 * Updated to use KIE.ai playground API with enhanced settings
 */
export const generateImageUltra = asyncHandler(async (req, res) => {
  console.log('🎯 [QWEN ULTRA] Starting request processing...');
  console.log('🎯 [QWEN ULTRA] Request body keys:', Object.keys(req.body));
  console.log('🎯 [QWEN ULTRA] User object:', req.user ? 'EXISTS' : 'NULL');
  
  const { prompt, input_image, style, aspectRatio = 'landscape_4_3', num_inference_steps = 40, guidance_scale = 6 } = req.body;
  const userId = req.user?.id;

  console.log('🎯 [QWEN ULTRA] Extracted data:', {
    hasPrompt: !!prompt,
    hasImage: !!input_image,
    userId: userId || 'NONE',
    style,
    aspectRatio
  });

  // Require authentication
  if (!userId) {
    console.log('🎯 [QWEN ULTRA] No userId - returning unauthorized');
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    console.log('🎯 [QWEN ULTRA] Missing required fields - returning bad request');
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  console.log('🎯 [QWEN ULTRA] Basic validation passed, proceeding...');

  const modelId = 'qwen-ultra';
  let generation = null;
  let creditsUsed = 0;

  try {
    console.log('🎯 [QWEN ULTRA] Checking credits for user:', userId);
    // Check and deduct credits using unified service
    const { user, creditsUsed: credits } = await checkAndDeductCredits(userId, modelId);
    creditsUsed = credits;
    console.log('🎯 [QWEN ULTRA] Credits check passed:', { used: credits, remaining: user.totalCredits - credits });

    // Create generation record
    console.log('🎯 [QWEN ULTRA] Creating generation record...');
    generation = await createGeneration(userId, {
      prompt,
      model: modelId,
      style,
      status: 'PENDING'
    });
    console.log('🎯 [QWEN ULTRA] Generation record created:', generation.id);

    console.log('Qwen Ultra generation request:', {
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      style,
      aspectRatio
    });

    // Process image URL
    console.log('🎯 [QWEN ULTRA] Processing image URL...');
    const imageUrl = await processImageUrl(input_image);
    console.log('🎯 [QWEN ULTRA] Image URL processed:', imageUrl ? 'SUCCESS' : 'FAILED');

    // Prepare KIE API request body with enhanced settings for Ultra
    const requestBody = {
      model: 'qwen/image-edit',
      input: {
        prompt,
        image_url: imageUrl,
        image_size: aspectRatio,
        num_inference_steps, // Higher for better quality
        guidance_scale, // Higher for better prompt adherence
        enable_safety_checker: true,
        output_format: 'png',
        sync_mode: false,
        acceleration: 'regular' // Regular acceleration for quality balance
      }
    };

    console.log('Sending Ultra request to KIE API:', {
      url: `${KIE_API_URL}/createTask`,
      model: requestBody.model,
      prompt: requestBody.input.prompt,
      imageUrl: requestBody.input.image_url,
      fullRequestBody: JSON.stringify(requestBody, null, 2)
    });

    // Create task with KIE API
    const createTaskResponse = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!createTaskResponse.ok) {
      const errorData = await createTaskResponse.json().catch(() => ({}));
      console.log('🚨 KIE API Error Response (Ultra):', {
        status: createTaskResponse.status,
        statusText: createTaskResponse.statusText,
        errorData: JSON.stringify(errorData, null, 2),
        url: `${KIE_API_URL}/createTask`,
        requestBody: JSON.stringify(requestBody, null, 2)
      });
      throw new Error(errorData.message || `HTTP error! status: ${createTaskResponse.status}`);
    }

    const taskResult = await createTaskResponse.json();
    
    if (taskResult.code !== 200) {
      throw new Error(taskResult.message || 'Failed to create task');
    }

    const taskId = taskResult.data.taskId;
    console.log('Created KIE API Ultra task:', taskId);

    // Poll for task completion with longer timeout for Ultra quality
    const result = await pollTaskStatus(taskId, 90, 3000); // 90 attempts, 3 seconds delay

    if (result.success && result.url) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image and get Cloudinary URLs
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: result.url, width: 1024, height: 1024 },
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
        image: savedImageData?.url || result.url,
        thumbnailUrl: savedImageData?.thumbnailUrl || result.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: {
          provider: 'KIE API',
          model: 'qwen/image-edit',
          quality: 'ultra'
        }
      });
    } else {
      throw new Error('Failed to generate image');
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
      details: error.message
    });
  }
});

/**
 * Helper function to process image URL for KIE API
 * KIE API requires a public URL, not base64 data
 */
async function processImageUrl(input_image) {
  // If it's already a URL, return it
  if (input_image.startsWith('http')) {
    return input_image;
  }

  // If it's base64, upload it to get a public URL
  if (input_image.startsWith('data:') || !input_image.startsWith('http')) {
    try {
      // Import storage utilities (same as Nano-Banana)
      const { uploadToCloudinary } = await import('../utils/imageStorage.js');
      
      // Clean base64 data
      const base64Clean = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
      const dataUrl = `data:image/jpeg;base64,${base64Clean}`;
      const filename = `qwen-input-${Date.now()}.jpg`;
      
      // Upload to get a URL (exactly like Nano-Banana)
      const uploadResult = await uploadToCloudinary(dataUrl, filename, 'temp');
      const imageUrl = uploadResult.localPath; // This is actually the Cloudinary secure_url
      
      console.log('Uploaded input image to Cloudinary for KIE API:', imageUrl);
      return imageUrl;
    } catch (uploadError) {
      console.error('Failed to upload image:', uploadError.message);
      throw new Error('Failed to process input image');
    }
  }

  return input_image;
}