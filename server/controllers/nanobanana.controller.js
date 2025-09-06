import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';
import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getStorageProvider } from '../utils/storageProvider.js';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Provider Configuration
// Set USE_FAL_AI=true to use Fal.ai, false or undefined to use KIE API
const USE_FAL_AI = process.env.USE_FAL_AI === 'true';

// KIE API Configuration (default)
const KIE_API_KEY = process.env.NANO_BANANA_API_KEY || process.env.KIE_API_KEY;
const KIE_API_URL = process.env.NANO_BANANA_API_URL || 'https://api.kie.ai/api/v1/playground';

console.log('🎯 API Provider:', USE_FAL_AI ? 'Fal.ai' : 'KIE API');
console.log('🔑 KIE API configured:', {
  hasKey: !!KIE_API_KEY,
  keyLength: KIE_API_KEY?.length,
  apiUrl: KIE_API_URL,
  hasCloudinaryConfig: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME
});

/**
 * Upload base64 image to Cloudinary for public URL access
 * KIE API requires public HTTP URLs, not base64 data
 */
async function uploadBase64ToCloudinary(base64Data) {
  try {
    console.log('📤 [CLOUDINARY] Converting base64 to public URL...');
    
    // Get storage provider (configured as Cloudinary)
    const storageProvider = getStorageProvider({ provider: 'cloudinary' });
    
    // Upload base64 data directly to Cloudinary
    const result = await storageProvider.uploadImage(base64Data, 'nano-banana-temp');
    
    console.log('✅ [CLOUDINARY] Base64 uploaded successfully:', result.url);
    return result.url;
  } catch (error) {
    console.error('❌ [CLOUDINARY] Upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

/**
 * Upload local file to Cloudinary for public URL access
 * Reads file from filesystem and converts to public URL
 */
async function uploadLocalFileToCloudinary(filePath) {
  try {
    console.log('📂 [CLOUDINARY] Reading local file:', filePath);
    
    // Check if file exists before reading
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('📤 [CLOUDINARY] Uploading local file to Cloudinary...');
    
    // Get storage provider (configured as Cloudinary)
    const storageProvider = getStorageProvider({ provider: 'cloudinary' });
    
    // Upload buffer to Cloudinary
    const result = await storageProvider.uploadImage(fileBuffer, 'nano-banana-styles');
    
    console.log('✅ [CLOUDINARY] Local file uploaded successfully:', result.url);
    return result.url;
  } catch (error) {
    console.error('❌ [CLOUDINARY] Local file upload error:', error.message);
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Cloudinary local file upload failed: ${error.message}`);
  }
}

/**
 * Poll KIE API task status until completion
 * Increased timeout for nano-banana processing (5 minutes instead of 2)
 */
async function pollTaskStatus(taskId, maxAttempts = 150, delayMs = 2000) {
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
      
      console.log(`🔄 [POLLING] Task ${taskId} attempt ${attempt + 1}/${maxAttempts}:`, { 
        state, 
        hasResult: !!resultJson, 
        timeElapsed: `${(attempt * delayMs / 1000).toFixed(1)}s`,
        failMsg 
      });

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

  throw new Error(`Task timeout - exceeded maximum polling attempts (${maxAttempts} attempts over ${(maxAttempts * delayMs / 1000 / 60).toFixed(1)} minutes)`);
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
      hasCloudinaryConfig: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    });

    // Process input image - Convert base64 to public URL like other working models
    let imageUrl = input_image;
    
    // Check if it's base64 data (with or without data URL prefix)
    const isBase64 = input_image.startsWith('data:') || 
                     (input_image.length > 100 && !input_image.startsWith('http'));
    
    if (isBase64) {
      console.log('📷 [NANO-BANANA] Converting base64 to public URL...');
      console.log('🔑 [NANO-BANANA] Cloudinary available:', !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY));
      try {
        // Add data URL prefix if missing
        let base64WithPrefix = input_image;
        if (!input_image.startsWith('data:')) {
          base64WithPrefix = `data:image/png;base64,${input_image}`;
          console.log('🔧 [NANO-BANANA] Added data URL prefix to base64 string');
        }
        
        imageUrl = await uploadBase64ToCloudinary(base64WithPrefix);
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
/**
 * Generate Pet Portrait with dual images using Nano-Banana
 * Supports both user pet image and style reference image
 */
export const generatePetPortrait = asyncHandler(async (req, res) => {
  const { userImageUrl, styleImageUrl, styleName, prompt, aspectRatio = '1:1' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate pet portraits');
  }

  // Validate required fields
  if (!prompt || !userImageUrl || !styleImageUrl) {
    return sendBadRequest(res, 'Prompt, user image, and style image are required for pet portraits');
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

    console.log('🎨 [NANO-BANANA] Pet Portrait generation request:', {
      hasPrompt: !!prompt,
      hasUserImage: !!userImageUrl,
      hasStyleImage: !!styleImageUrl,
      styleName,
      aspectRatio
    });

    // Process both images - convert base64 to public URLs if needed
    let processedUserImageUrl = userImageUrl;
    let processedStyleImageUrl = styleImageUrl;
    
    // Process user image
    if (userImageUrl.startsWith('data:') || (userImageUrl.length > 100 && !userImageUrl.startsWith('http'))) {
      console.log('📷 [NANO-BANANA] Converting user image base64 to public URL...');
      let base64WithPrefix = userImageUrl.startsWith('data:') ? userImageUrl : `data:image/png;base64,${userImageUrl}`;
      processedUserImageUrl = await uploadBase64ToCloudinary(base64WithPrefix);
      console.log('✅ [NANO-BANANA] User image converted:', processedUserImageUrl.substring(0, 50) + '...');
    }
    
    // Process style image - handle local file paths, base64, and URLs
    if (styleImageUrl.startsWith('data:') || (styleImageUrl.length > 100 && !styleImageUrl.startsWith('http'))) {
      // Handle base64 style images
      console.log('🎨 [NANO-BANANA] Converting style image base64 to public URL...');
      let base64WithPrefix = styleImageUrl.startsWith('data:') ? styleImageUrl : `data:image/png;base64,${styleImageUrl}`;
      processedStyleImageUrl = await uploadBase64ToCloudinary(base64WithPrefix);
      console.log('✅ [NANO-BANANA] Style image converted:', processedStyleImageUrl.substring(0, 50) + '...');
    } else if (styleImageUrl.startsWith('/')) {
      // Handle local file paths (starts with /) - most common case for Pet Portrait styles
      console.log('📁 [NANO-BANANA] Processing local style image file:', styleImageUrl);
      
      // Try multiple possible paths
      const possiblePaths = [
        path.join(process.cwd(), '..', 'client', 'public', styleImageUrl), // ../client/public/...
        path.join(process.cwd(), 'client', 'public', styleImageUrl), // client/public/... (if server is in wrong dir)
        path.join(__dirname, '..', '..', 'client', 'public', styleImageUrl), // from __dirname
        path.join('C:', 'Users', 'Denis', 'Desktop', 'Colibrrri-clone', 'client', 'public', styleImageUrl) // absolute path
      ];
      
      console.log('🔍 [NANO-BANANA] Trying paths:', possiblePaths.map(p => p.substring(0, 60) + '...'));
      
      let uploadedSuccessfully = false;
      for (const tryPath of possiblePaths) {
        try {
          if (fs.existsSync(tryPath)) {
            console.log('✅ [NANO-BANANA] Found file at:', tryPath);
            processedStyleImageUrl = await uploadLocalFileToCloudinary(tryPath);
            console.log('✅ [NANO-BANANA] Local style image uploaded:', processedStyleImageUrl.substring(0, 50) + '...');
            uploadedSuccessfully = true;
            break;
          } else {
            console.log('❌ [NANO-BANANA] File not found at:', tryPath);
          }
        } catch (error) {
          console.log('❌ [NANO-BANANA] Error trying path:', tryPath, error.message);
          continue;
        }
      }
      
      if (!uploadedSuccessfully) {
        throw new Error(`Style image file not found: ${styleImageUrl}. Tried ${possiblePaths.length} different paths.`);
      }
    } else {
      console.log('🔗 [NANO-BANANA] Using style image as URL (no conversion needed):', styleImageUrl.substring(0, 50) + '...');
    }

    // Enhanced prompt for Pet Portrait with style transfer
    const enhancedPrompt = `Transform the pet from the first image into a painted portrait masterpiece that completely matches the artistic style, brushwork, lighting, and aesthetic of the second reference image. The pet must be rendered in the same painterly, artistic style as the clothing and background - NOT photorealistic. CRITICAL: The pet must have a FULLY CLOSED MOUTH - no open mouth, no visible tongue, no teeth showing, lips completely sealed shut in a dignified manner like classical portrait subjects. The pet should have a calm, composed facial expression with mouth firmly closed, displaying regal nobility and aristocratic bearing. The pet's face should have the same painted, artistic quality as historical portraits with soft brushstrokes and classical painting techniques. Apply the elegant ${styleName} painting style to the pet's entire form, making it look like it was painted by the same artist who created classical royal portraits. Remember: mouth must be completely closed and sealed - this is essential for the noble portrait aesthetic. No photorealistic elements - everything should be unified in one cohesive painted artistic style. ${prompt}`;

    // Create task with KIE API using dual images
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: enhancedPrompt,
        image_urls: [processedUserImageUrl, processedStyleImageUrl] // Dual images!
      }
    };
    
    console.log('🚀 [NANO-BANANA] Pet Portrait request to KIE API:', {
      url: `${KIE_API_URL}/createTask`,
      model: requestBody.model,
      prompt: enhancedPrompt.substring(0, 100) + '...',
      userImageUrl: processedUserImageUrl.substring(0, 50) + '...',
      styleImageUrl: processedStyleImageUrl.substring(0, 50) + '...',
      imageCount: requestBody.input.image_urls.length
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
      throw new Error(taskResult.message || 'Failed to create pet portrait task');
    }

    const taskId = taskResult.data.taskId;
    console.log('🎯 [NANO-BANANA] Created Pet Portrait task:', taskId);

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
        console.log('🖼️ Pet Portrait image saved to user gallery');
      } catch (saveError) {
        console.log('Pet Portrait image not saved:', saveError.message);
      }
      
      // Prepare response data in the format frontend expects
      const responseData = {
        success: true,
        imageUrl: result.url,
        generation: generation,
        remainingCredits: user.totalCredits - creditsUsed,
        message: 'Pet Portrait generated successfully',
        model: modelId,
        metadata: {
          provider: 'KIE API',
          model: 'google/nano-banana-edit',
          mode: 'pet-portrait-dual-image',
          styleName,
          taskId
        }
      };
      
      console.log('🍌 Nano-banana response received:', {
        success: responseData.success,
        hasImageUrl: !!responseData.imageUrl,
        imageUrlPreview: responseData.imageUrl?.substring(0, 50) + '...',
        remainingCredits: responseData.remainingCredits
      });
      
      console.log('🍌 Full nano-banana response data:', JSON.stringify({
        message: responseData.message,
        success: responseData.success,
        imageUrl: responseData.imageUrl?.substring(0, 80) + '...',
        model: responseData.model
      }, null, 2));
      
      console.log('🍌 Nano-banana Pet Portrait success! {');
      
      // Send success response
      return res.status(200).json(responseData);
    } else {
      throw new Error(result.error || 'Pet Portrait generation failed');
    }

  } catch (error) {
    console.error('❌ [NANO-BANANA] Pet Portrait error:', error.message);
    logAIServiceError(error, 'Nano-Banana', 'generatePetPortrait');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Nano-Banana Pet Portrait generation failed');
      } catch (refundError) {
        console.error('Failed to refund Pet Portrait credits:', refundError);
      }
    }
    
    // Check for specific error types
    if (error.statusCode === 400) {
      return sendBadRequest(res, error.message, error.details);
    }
    
    if (error.statusCode === 401) {
      return sendUnauthorized(res, error.message);
    }
    
    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Nano-Banana');
    return sendServerError(res, userFriendlyMessage, {
      details: error.message
    });
  }
});

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
      baseImageUrl = await uploadBase64ToCloudinary(base64WithPrefix);
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