import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';
import fetch from 'node-fetch';
import axios from 'axios';

// FAL API Configuration for Qwen
const FAL_KEY = process.env.FAL_KEY || null;

console.log('🔑 FAL API configured for Qwen:', {
  hasKey: !!FAL_KEY,
  keyLength: FAL_KEY ? FAL_KEY.length : 0
});

const mapAspectRatioToFalSize = (aspectRatio) => {
  const mapping = {
    '1:1': 'square',
    'square': 'square',
    '3:4': 'portrait_4_3',
    'portrait': 'portrait_4_3',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    'landscape': 'landscape_4_3',
    'landscape_4_3': 'landscape_4_3',
    '16:9': 'landscape_16_9'
  };

  return mapping[aspectRatio] || 'landscape_4_3';
};

/**
 * Upload base64 image to public URL with IMGBB primary, Cloudinary fallback
 * KIE API requires public HTTP URLs, not base64 data
 */
async function uploadBase64ToImgbb(base64Data) {
  // Try IMGBB first
  try {
    return await uploadToIMGBB(base64Data);
  } catch (imgbbError) {
    console.warn('⚠️ [IMGBB] Primary upload failed, trying Cloudinary fallback:', imgbbError.message);
    
    // Fallback to Cloudinary
    try {
      return await uploadToCloudinaryFallback(base64Data);
    } catch (cloudinaryError) {
      console.error('❌ [FALLBACK] Both IMGBB and Cloudinary failed');
      throw new Error(`Image upload failed. IMGBB: ${imgbbError.message}. Cloudinary: ${cloudinaryError.message}`);
    }
  }
}

/**
 * Primary IMGBB upload function
 */
async function uploadToIMGBB(base64Data) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured');
  }

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
}

/**
 * Cloudinary fallback upload function
 */
async function uploadToCloudinaryFallback(base64Data) {
  const { v2: cloudinary } = await import('cloudinary');
  
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured - cannot use fallback');
  }

  console.log('📤 [CLOUDINARY] Fallback: Converting base64 to public URL...');
  
  // Cloudinary can accept base64 data directly
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'vheer-ai/temp',
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto'
  });
  
  if (result?.secure_url) {
    console.log('✅ [CLOUDINARY] Fallback upload successful:', result.secure_url);
    return result.secure_url;
  } else {
    throw new Error('Cloudinary upload failed - no secure_url in response');
  }
}

/**
 * Upload image URL to IMGBB for HTTPS compatibility
 */
async function uploadToImgbb(imageUrl) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured');
  }

  try {
    console.log('📤 [IMGBB] Downloading image from:', imageUrl);
    
    // Download image from URL
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // Convert to base64
    const base64 = Buffer.from(response.data).toString('base64');
    
    // Upload to IMGBB
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    
    const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (imgbbResponse.data?.success && imgbbResponse.data?.data?.url) {
      console.log('✅ [IMGBB] Upload successful:', imgbbResponse.data.data.url);
      return imgbbResponse.data.data.url;
    } else {
      throw new Error('IMGBB upload failed - no URL in response');
    }
  } catch (error) {
    console.error('❌ [IMGBB] Upload error:', error.message);
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

    if (!FAL_KEY) {
      throw new Error('FAL API key not configured');
    }

    // Import fal client for Qwen Image
    const { fal } = await import('@fal-ai/client');

    // Configure fal client
    fal.config({
      credentials: FAL_KEY
    });

    console.log('🚀 [QWEN FAL.AI] Sending request to Fal.ai Qwen Image:', {
      prompt: prompt,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      image_size: mapAspectRatioToFalSize(aspectRatio),
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale
    });

    // Submit to Fal.ai Qwen Image
    const falResult = await fal.subscribe('fal-ai/qwen-image-edit', {
      input: {
        prompt: prompt,
        image_url: imageUrl,
        image_size: mapAspectRatioToFalSize(aspectRatio),
        num_inference_steps: num_inference_steps,
        guidance_scale: guidance_scale,
        enable_safety_checker: true,
        output_format: 'png',
        sync_mode: false
      }
    });

    console.log('🔍 [QWEN FAL.AI] Raw response from Fal.ai:', JSON.stringify(falResult, null, 2));
    console.log('✅ [QWEN FAL.AI] Generation completed');

    if (!falResult || typeof falResult !== 'object') {
      console.error('❌ [QWEN FAL.AI] Invalid response format:', falResult);
      throw new Error(`Invalid response from Fal.ai: ${typeof falResult}`);
    }

    // Handle Fal.ai response structure: { data: { images: [...] }, requestId: "..." }
    const images = falResult.data?.images || falResult.images;

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('❌ [QWEN FAL.AI] No images in response. Available keys:', Object.keys(falResult));
      console.error('❌ [QWEN FAL.AI] Images field:', images);
      console.error('❌ [QWEN FAL.AI] Data field:', falResult.data);
      throw new Error('No images generated by Fal.ai Qwen Image');
    }

    const formattedImages = images.map(img => ({
      url: img.url,
      width: img.width || 1024,
      height: img.height || 1024
    }));
    const primaryImage = formattedImages[0];

    // Update generation status
    await completeGeneration(generation.id);
    
    // Try to save the generated image and get Cloudinary URLs
    let savedImageData = null;
    try {
      console.log('🔄 [QWEN FAL.AI] Attempting to save image to Cloudinary:', {
        originalUrl: primaryImage.url,
        userId: user.id,
        userCanSave: user.isPremium || user.isAdmin || false
      });

      savedImageData = await saveGeneratedImage(
        { url: primaryImage.url, width: primaryImage.width, height: primaryImage.height },
        user,
        generation
      );

      if (savedImageData) {
        console.log('✅ [QWEN FAL.AI] Image saved to Cloudinary successfully:', {
          cloudinaryUrl: savedImageData.url,
          thumbnailUrl: savedImageData.thumbnailUrl,
          savedImageId: savedImageData.id
        });
      } else {
        console.log('⚠️ [QWEN FAL.AI] Image not saved to gallery - user not eligible');
        console.log('🔄 [QWEN FAL.AI] Uploading to IMGBB for HTTPS compatibility...');

        // Even if user can't save to gallery, upload to IMGBB for HTTPS compatibility
        try {
          const imgbbUrl = await uploadToImgbb(primaryImage.url);

          // Create temporary image data object without saving to database
          savedImageData = {
            url: imgbbUrl,
            thumbnailUrl: imgbbUrl,
            id: 'temp-' + Date.now()
          };

          console.log('✅ [QWEN FAL.AI] IMGBB upload successful:', {
            imgbbUrl: savedImageData.url
          });
        } catch (tempError) {
          console.error('❌ [QWEN FAL.AI] IMGBB upload failed:', tempError.message);
        }
      }
    } catch (saveError) {
      console.error('❌ [QWEN FAL.AI] Image save error:', saveError.message);
      console.error('❌ [QWEN FAL.AI] Save error stack:', saveError.stack);
    }

    // Send success response in the format frontend expects
    const responseData = {
      success: true,
      image: savedImageData?.url || primaryImage.url,
      thumbnailUrl: savedImageData?.thumbnailUrl || primaryImage.url,
      images: formattedImages,
      credits: {
        used: creditsUsed,
        remaining: user.totalCredits - creditsUsed
      },
      model: modelId,
      metadata: {
        provider: 'Fal.ai',
        model: 'qwen/image-edit'
      }
    };
    
    console.log('📤 [QWEN] Sending success response to client:', {
      success: responseData.success,
      hasImage: !!responseData.image,
      hasThumb: !!responseData.thumbnailUrl,
      imageUrl: responseData.image?.substring(0, 80) + '...',
      creditsUsed: responseData.credits.used,
      creditsRemaining: responseData.credits.remaining
    });
    
    return res.status(200).json(responseData);
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
    aspectRatio,
    imagePreview: input_image?.substring(0, 100) + '...',
    imageType: input_image?.startsWith('http') ? 'HTTP_URL' : input_image?.startsWith('data:') ? 'BASE64' : 'OTHER'
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

    if (!FAL_KEY) {
      throw new Error('FAL API key not configured');
    }

    // Import fal client for Qwen Image Ultra
    const { fal } = await import('@fal-ai/client');

    // Configure fal client
    fal.config({
      credentials: FAL_KEY
    });

    console.log('🚀 [QWEN ULTRA FAL.AI] Sending request to Fal.ai Qwen Image:', {
      prompt: prompt,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      image_size: mapAspectRatioToFalSize(aspectRatio),
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale
    });

    // Submit to Fal.ai Qwen Image
    const falResult = await fal.subscribe('fal-ai/qwen-image-edit', {
      input: {
        prompt: prompt,
        image_url: imageUrl,
        image_size: mapAspectRatioToFalSize(aspectRatio),
        num_inference_steps: num_inference_steps,
        guidance_scale: guidance_scale,
        enable_safety_checker: true,
        output_format: 'png',
        sync_mode: false
      }
    });

    console.log('🔍 [QWEN ULTRA FAL.AI] Raw response from Fal.ai:', JSON.stringify(falResult, null, 2));
    console.log('✅ [QWEN ULTRA FAL.AI] Generation completed');

    if (!falResult || typeof falResult !== 'object') {
      console.error('❌ [QWEN ULTRA FAL.AI] Invalid response format:', falResult);
      throw new Error(`Invalid response from Fal.ai: ${typeof falResult}`);
    }

    // Handle Fal.ai response structure: { data: { images: [...] }, requestId: "..." }
    const images = falResult.data?.images || falResult.images;

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('❌ [QWEN ULTRA FAL.AI] No images in response. Available keys:', Object.keys(falResult));
      console.error('❌ [QWEN ULTRA FAL.AI] Images field:', images);
      console.error('❌ [QWEN ULTRA FAL.AI] Data field:', falResult.data);
      throw new Error('No images generated by Fal.ai Qwen Image');
    }

    const formattedImages = images.map(img => ({
      url: img.url,
      width: img.width || 1024,
      height: img.height || 1024
    }));
    const primaryImage = formattedImages[0];

    // Update generation status
    await completeGeneration(generation.id);
    
    // Try to save the generated image and get Cloudinary URLs
    let savedImageData = null;
    try {
      console.log('🔄 [QWEN] Attempting to save image to Cloudinary:', {
        originalUrl: primaryImage.url,
        userId: user.id,
        userCanSave: user.isPremium || user.isAdmin || false
      });
      
      savedImageData = await saveGeneratedImage(
        { url: primaryImage.url, width: primaryImage.width, height: primaryImage.height },
        user,
        generation
      );
      
      if (savedImageData) {
        console.log('✅ [QWEN] Image saved to Cloudinary successfully:', {
          cloudinaryUrl: savedImageData.url,
          thumbnailUrl: savedImageData.thumbnailUrl,
          savedImageId: savedImageData.id
        });
      } else {
        console.log('⚠️ [QWEN] Image not saved to gallery - user not eligible');
        console.log('🔄 [QWEN] Uploading to IMGBB for HTTPS compatibility...');
        
        // Even if user can't save to gallery, upload to IMGBB for HTTPS compatibility
        try {
          const imgbbUrl = await uploadToImgbb(primaryImage.url);
          
          // Create temporary image data object without saving to database
          savedImageData = {
            url: imgbbUrl,
            thumbnailUrl: imgbbUrl,
            id: 'temp-' + Date.now()
          };
          
          console.log('✅ [QWEN] IMGBB upload successful:', {
            imgbbUrl: savedImageData.url
          });
        } catch (tempError) {
          console.error('❌ [QWEN] IMGBB upload failed:', tempError.message);
        }
      }
    } catch (saveError) {
      console.error('❌ [QWEN] Image save error:', saveError.message);
      console.error('❌ [QWEN] Save error stack:', saveError.stack);
    }
    
    const responsePayload = {
      success: true,
      image: savedImageData?.url || primaryImage.url,
      thumbnailUrl: savedImageData?.thumbnailUrl || primaryImage.url,
      images: formattedImages,
      credits: {
        used: creditsUsed,
        remaining: user.totalCredits - creditsUsed
      },
      model: modelId,
      metadata: {
        provider: 'Fal.ai',
        model: 'qwen/image-edit',
        quality: 'ultra'
      }
    };

    console.log('📤 [QWEN ULTRA] Sending success response to client:', {
      hasImage: !!responsePayload.image,
      imageUrl: responsePayload.image?.substring(0, 80) + '...',
      creditsUsed: responsePayload.credits.used,
      creditsRemaining: responsePayload.credits.remaining
    });

    return res.status(200).json(responsePayload);
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
 */
async function processImageUrl(input_image) {
  console.log('🔍 [QWEN DEBUG] processImageUrl called with:', {
    type: typeof input_image,
    length: input_image?.length,
    preview: input_image?.substring(0, 100) + '...',
    isHttp: input_image?.startsWith('http'),
    isData: input_image?.startsWith('data:'),
    fullUrl: input_image
  });

  // If it's already a URL, return it as is
  if (input_image.startsWith('http')) {
    console.log('🌐 [QWEN DEBUG] Returning HTTP URL as-is:', input_image);
    return input_image;
  }

  // For base64 images, we need to convert them to a public URL
  if (input_image.startsWith('data:')) {
    console.log('📷 [QWEN DEBUG] Received base64 image data - converting to public URL');
    
    // KIE API requires public HTTP URLs, not base64 data
    // Convert base64 to IMGBB hosted URL for public access
    try {
      const imgbbUrl = await uploadBase64ToImgbb(input_image);
      console.log('✅ [QWEN DEBUG] Base64 converted to public URL:', imgbbUrl);
      return imgbbUrl;
    } catch (error) {
      console.error('❌ [QWEN DEBUG] Failed to convert base64 to URL:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  console.log('❓ [QWEN DEBUG] Unknown image format, returning as-is:', input_image);
  return input_image;
}
