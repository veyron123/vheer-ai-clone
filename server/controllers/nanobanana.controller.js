import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';
import fetch from 'node-fetch';
import axios from 'axios';

// KIE API Configuration
const KIE_API_KEY = process.env.NANO_BANANA_API_KEY || process.env.KIE_API_KEY;
const KIE_API_URL = process.env.NANO_BANANA_API_URL || 'https://api.kie.ai/api/v1/playground';

console.log('🔑 KIE API configured:', {
  hasKey: !!KIE_API_KEY,
  keyLength: KIE_API_KEY?.length,
  apiUrl: KIE_API_URL,
  hasImgbbKey: !!process.env.IMGBB_API_KEY,
  imgbbKeyLength: process.env.IMGBB_API_KEY?.length
});

/**
 * Upload base64 image to IMGBB for public URL access
 * KIE API requires public HTTP URLs, not base64 data
 */
async function uploadBase64ToImgbb(base64Data) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured - cannot convert base64 to public URL');
  }

  try {
    console.log('📤 [IMGBB] Converting base64 to public URL...');
    
    // Extract base64 content (remove data:image/...;base64, prefix)
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
      console.log('✅ [IMGBB] Base64 uploaded successfully:', publicUrl);
      return publicUrl;
    } else {
      throw new Error('IMGBB upload failed - no URL in response');
    }
  } catch (error) {
    console.error('❌ [IMGBB] Upload error:', error.message);
    if (error.response?.data) {
      console.error('❌ [IMGBB] Error details:', error.response.data);
    }
    throw error;
  }
}

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
 * Generate image with Nano-Banana (image-to-image)
 * Using KIE API
 */
export const generateImage = asyncHandler(async (req, res) => {
  const { prompt, input_image, aspectRatio = '1:1' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !input_image) {
    return sendBadRequest(res, 'Prompt and input_image are required');
  }

  const modelId = 'nano-banana';
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
      status: 'PENDING'
    });

    console.log('Nano-Banana generation request:', {
      hasPrompt: !!prompt,
      hasImage: !!input_image,
      imagePreview: input_image?.substring(0, 50) + '...',
      aspectRatio,
      imageType: input_image?.startsWith('data:') ? 'base64_with_prefix' : 
                 (input_image?.length > 100 && !input_image?.startsWith('http')) ? 'base64_raw' : 'url',
      hasImgbbKey: !!process.env.IMGBB_API_KEY
    });

    // Process input image - Convert base64 to public URL like other working models
    let imageUrl = input_image;
    
    // Check if it's base64 data (with or without data URL prefix)
    const isBase64 = input_image.startsWith('data:') || 
                     (input_image.length > 100 && !input_image.startsWith('http'));
    
    if (isBase64) {
      console.log('📷 [NANO-BANANA] Converting base64 to public URL...');
      console.log('🔑 [NANO-BANANA] IMGBB Key available:', !!process.env.IMGBB_API_KEY);
      try {
        // Add data URL prefix if missing
        let base64WithPrefix = input_image;
        if (!input_image.startsWith('data:')) {
          base64WithPrefix = `data:image/png;base64,${input_image}`;
          console.log('🔧 [NANO-BANANA] Added data URL prefix to base64 string');
        }
        
        imageUrl = await uploadBase64ToImgbb(base64WithPrefix);
        console.log('✅ [NANO-BANANA] Base64 converted to public URL:', imageUrl);
      } catch (error) {
        console.error('❌ [NANO-BANANA] Failed to convert base64 to URL:', error.message);
        throw new Error(`Failed to process image: ${error.message}`);
      }
    } else {
      console.log('🔗 [NANO-BANANA] Using input image as URL (no conversion needed):', imageUrl?.substring(0, 50) + '...');
    }

    // Create task with KIE API
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: prompt,
        image_urls: [imageUrl]
      }
    };
    
    console.log('Sending request to KIE API:', {
      url: `${KIE_API_URL}/createTask`,
      model: requestBody.model,
      prompt: requestBody.input.prompt,
      imageUrl: requestBody.input.image_urls[0]
    });
    
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
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
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
        image: result.url,
        thumbnailUrl: result.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: {
          provider: 'KIE API',
          model: 'google/nano-banana-edit'
        }
      });
    } else {
      throw new Error('Failed to generate image');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Nano-Banana', 'generateImage');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Nano-Banana generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Nano-Banana');
    return sendServerError(res, userFriendlyMessage, {
      details: error.message
    });
  }
});

/**
 * Generate from prompt only (text-to-image)
 * Note: KIE API's nano-banana-edit requires an input image
 * We'll create a white base image for text-to-image generation
 */
export const generateFromPrompt = asyncHandler(async (req, res) => {
  const { prompt, aspectRatio = '1:1' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt) {
    return sendBadRequest(res, 'Prompt is required');
  }

  const modelId = 'nano-banana';
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
      status: 'PENDING'
    });

    console.log('Nano-Banana text-to-image request:', {
      prompt,
      aspectRatio
    });

    // Import image generation utilities
    const { createPlaceholderImage } = await import('../utils/imageGeneration.js');
    
    // Create a base image for text-to-image generation
    // Using a neutral base that can be transformed
    const baseImageResult = await createPlaceholderImage(
      'Clean white canvas background', 
      'Base image for AI generation'
    );

    // Convert base image to IMGBB URL if it's base64
    let baseImageUrl = baseImageResult.url;
    const isBaseBase64 = baseImageUrl.startsWith('data:') || 
                         (baseImageUrl.length > 100 && !baseImageUrl.startsWith('http'));
    
    if (isBaseBase64) {
      console.log('📷 [NANO-BANANA TEXT] Converting base image to public URL...');
      // Add data URL prefix if missing
      let base64WithPrefix = baseImageUrl;
      if (!baseImageUrl.startsWith('data:')) {
        base64WithPrefix = `data:image/png;base64,${baseImageUrl}`;
        console.log('🔧 [NANO-BANANA TEXT] Added data URL prefix to base image');
      }
      baseImageUrl = await uploadBase64ToImgbb(base64WithPrefix);
    }
    
    // Create task with KIE API using the base image
    const createTaskResponse = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/nano-banana-edit',
        input: {
          prompt: `Create a new image based on this description: ${prompt}`,
          image_urls: [baseImageUrl]
        }
      })
    });

    if (!createTaskResponse.ok) {
      const errorData = await createTaskResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${createTaskResponse.status}`);
    }

    const taskResult = await createTaskResponse.json();
    
    if (taskResult.code !== 200) {
      throw new Error(taskResult.message || 'Failed to create task');
    }

    const taskId = taskResult.data.taskId;
    console.log('Created KIE API task for text-to-image:', taskId);

    // Poll for task completion
    const result = await pollTaskStatus(taskId);

    if (result.success && result.url) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: result.url, width: 1024, height: 1024 },
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
        image: result.url,
        thumbnailUrl: result.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: {
          provider: 'KIE API',
          model: 'google/nano-banana-edit',
          mode: 'text-to-image'
        }
      });
    } else {
      throw new Error('Failed to generate image');
    }

  } catch (error) {
    // Log the error
    logAIServiceError(error, 'Nano-Banana', 'generateFromPrompt');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Nano-Banana generation failed');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Nano-Banana');
    return sendServerError(res, userFriendlyMessage, {
      details: error.message
    });
  }
});