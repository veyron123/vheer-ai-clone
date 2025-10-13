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

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
const hasImgbbConfig = Boolean(process.env.IMGBB_API_KEY);

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Provider Configuration
// Set USE_FAL_AI=false to force KIE API; defaults to Fal.ai when unset
const USE_FAL_AI = process.env.USE_FAL_AI
  ? process.env.USE_FAL_AI.toLowerCase() === 'true'
  : true;

// KIE API Configuration (default)
const KIE_API_KEY = process.env.NANO_BANANA_API_KEY || process.env.KIE_API_KEY;
const KIE_API_URL = process.env.NANO_BANANA_API_URL || 'https://api.kie.ai/api/v1/playground';

console.log('🎯 API Provider:', USE_FAL_AI ? 'Fal.ai' : 'KIE API');
console.log('🔑 KIE API configured:', {
  hasKey: !!KIE_API_KEY,
  keyLength: KIE_API_KEY?.length,
  apiUrl: KIE_API_URL,
  hasCloudinaryConfig,
  hasImgbbConfig,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME
});

/**
 * Upload base64 image to a public host (IMGBB primary, Cloudinary fallback)
 * KIE API requires public HTTP URLs, not base64 data
 */
async function uploadBase64ToPublicHost(base64Data) {
  const attempts = [];
  const withPrefix = base64Data.startsWith('data:')
    ? base64Data
    : `data:image/png;base64,${base64Data}`;

  if (hasImgbbConfig) {
    try {
      console.log('📤 [IMGBB] Converting base64 to public URL...');
      const base64Content = withPrefix.replace(/^data:image\/[a-z0-9+.-]+;base64,/, '');
      const formData = new URLSearchParams();
      formData.append('key', process.env.IMGBB_API_KEY);
      formData.append('image', base64Content);

      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      const publicUrl = response.data?.data?.url;
      if (response.data?.success && publicUrl) {
        console.log('✅ [IMGBB] Base64 uploaded successfully:', publicUrl);
        return publicUrl;
      }

      attempts.push('IMGBB: upload succeeded without URL in response');
    } catch (error) {
      console.error('❌ [IMGBB] Upload error:', error.message);
      attempts.push(`IMGBB: ${error.message}`);
    }
  } else {
    attempts.push('IMGBB: API key not configured');
  }

  if (hasCloudinaryConfig) {
    try {
      console.log('📤 [CLOUDINARY] Converting base64 to public URL...');
      const { v2: cloudinary } = await import('cloudinary');

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      const result = await cloudinary.uploader.upload(withPrefix, {
        folder: 'vheer-ai/nano-banana',
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto'
      });

      if (result?.secure_url) {
        console.log('✅ [CLOUDINARY] Base64 uploaded successfully:', result.secure_url);
        return result.secure_url;
      }

      attempts.push('Cloudinary: upload succeeded without secure_url in response');
    } catch (error) {
      console.error('❌ [CLOUDINARY] Upload error:', error.message);
      attempts.push(`Cloudinary: ${error.message}`);
    }
  } else {
    attempts.push('Cloudinary: credentials not configured');
  }

  throw new Error(`Image upload failed. ${attempts.join(' | ')}`);
}

/**
 * Upload local file to a public host for URL access
 * Reads file from filesystem and converts to public URL
 */
async function uploadLocalFileToPublicHost(filePath) {
  try {
    console.log('📂 [UPLOAD] Reading local file:', filePath);
    
    // Check if file exists before reading
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('📤 [UPLOAD] Uploading local file to public host...');
    
    const mimeType = getMimeFromExtension(path.extname(filePath));
    const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    const publicUrl = await uploadBase64ToPublicHost(base64Data);
    
    console.log('✅ [UPLOAD] Local file uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ [UPLOAD] Local file upload error:', error.message);
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Public host local file upload failed: ${error.message}`);
  }
}

function getMimeFromExtension(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.png':
    default:
      return 'image/png';
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
        
        imageUrl = await uploadBase64ToPublicHost(base64WithPrefix);
        console.log('✅ [NANO-BANANA] Base64 converted to public URL:', imageUrl);
      } catch (error) {
        console.error('❌ [NANO-BANANA] Failed to convert base64 to URL:', error.message);
        throw new Error(`Failed to process image: ${error.message}`);
      }
    } else {
      console.log('🔗 [NANO-BANANA] Using input image as URL (no conversion needed):', imageUrl?.substring(0, 50) + '...');
    }

    let result = null;
    let providerUsed = null;
    let taskId = null;
    let requestId = null;

    if (USE_FAL_AI) {
      console.log('🚀 [FAL.AI] Using Fal.ai nano-banana for generation...');

      // Import fal client lazily only when needed
      const { fal } = await import('@fal-ai/client');

      // Configure fal client
      fal.config({
        credentials: process.env.FAL_KEY
      });

      console.log('🚀 [FAL.AI] Sending request to Fal.ai nano-banana:', {
        prompt,
        imageUrl: imageUrl?.substring(0, 50) + '...',
        num_images: 1,
        sync_mode: false
      });

      // Submit to Fal.ai nano-banana
      const falResult = await fal.subscribe('fal-ai/nano-banana/edit', {
        input: {
          prompt: prompt.length > 150 ? prompt.substring(0, 150) + '...' : prompt,
          image_urls: [imageUrl],
          strength: 0.8,
          guidance_scale: 7.5,
          num_inference_steps: 20,
          aspect_ratio: aspectRatio
        }
      });

      console.log('🔍 [FAL.AI] Raw response from Fal.ai:', JSON.stringify(falResult, null, 2));
      console.log('✅ [FAL.AI] Generation completed');

      if (!falResult || typeof falResult !== 'object') {
        console.error('❌ [FAL.AI] Invalid response format:', falResult);
        throw new Error(`Invalid response from Fal.ai: ${typeof falResult}`);
      }

      const images = falResult.data?.images || falResult.images;

      if (!images || !Array.isArray(images) || images.length === 0) {
        console.error('❌ [FAL.AI] No images in response. Available keys:', Object.keys(falResult));
        console.error('❌ [FAL.AI] Images field:', images);
        console.error('❌ [FAL.AI] Data field:', falResult.data);
        throw new Error('No images generated by Fal.ai');
      }

      providerUsed = 'Fal.ai';
      requestId = falResult.requestId || null;
      result = {
        success: true,
        url: images[0].url,
        width: images[0].width || 1024,
        height: images[0].height || 1024
      };
    } else {
      console.log('🔑 [KIE API] Using KIE API nano-banana for generation...');

      const requestBody = {
        model: 'google/nano-banana-edit',
        input: {
          prompt,
          image_urls: [imageUrl],
          aspect_ratio: aspectRatio
        }
      };

      console.log('🚀 [NANO-BANANA] Submitting task to KIE API:', {
        url: `${KIE_API_URL}/createTask`,
        model: requestBody.model,
        promptPreview: prompt.substring(0, 100) + '...',
        imageUrl: imageUrl?.substring(0, 50) + '...'
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
        throw new Error(taskResult.message || 'Failed to create nano-banana task');
      }

      taskId = taskResult.data?.taskId;
      console.log('🎯 [NANO-BANANA] Created KIE task:', taskId);

      const pollResult = await pollTaskStatus(taskId);
      result = pollResult;
      providerUsed = 'KIE API';
    }

    const finalUrl = result?.url;
    
    if (finalUrl) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: finalUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('Image saved to user gallery');
      } catch (saveError) {
        console.log('Image not saved:', saveError.message);
      }
      
      const resolvedProvider = providerUsed || (USE_FAL_AI ? 'Fal.ai' : 'KIE API');
      const metadata = {
        provider: resolvedProvider,
        model: resolvedProvider === 'Fal.ai' ? 'fal-ai/nano-banana' : 'google/nano-banana-edit'
      };

      if (resolvedProvider === 'Fal.ai' && requestId) {
        metadata.requestId = requestId;
      }

      if (resolvedProvider === 'KIE API' && taskId) {
        metadata.taskId = taskId;
      }

      // Send success response in the format frontend expects
      return res.status(200).json({
        success: true,
        image: finalUrl,
        thumbnailUrl: finalUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata
      });
    } else {
      console.log('❌ [GENERATION FAILED] Invalid result structure:', {
        provider: providerUsed || (USE_FAL_AI ? 'Fal.ai' : 'KIE API'),
        resultKeys: result ? Object.keys(result) : 'null',
        hasUrl: result?.url ? 'yes' : 'no',
        hasSuccess: result?.success ? 'yes' : 'no'
      });
      throw new Error('Failed to generate image - invalid response format');
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
  const {
    userImageUrl,
    styleImageUrl,
    styleName,
    prompt,
    aspectRatio = '1:1',
    mode: requestMode
  } = req.body;
  const userId = req.user?.id;
  const normalizedMode = (requestMode || (req.originalUrl?.includes('action-figure') ? 'action-figure' : 'pet-portrait')).toLowerCase();
  const isActionFigure = normalizedMode === 'action-figure';
  const featureLabel = isActionFigure ? 'Action Figure' : 'Pet Portrait';

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to use this generator');
  }

  // Validate required fields
  if (!prompt || !userImageUrl || !styleImageUrl) {
    return sendBadRequest(res, 'Prompt, user image, and style image are required for this generator');
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

    console.log(`🎨 [NANO-BANANA] ${featureLabel} generation request:`, {
      hasPrompt: !!prompt,
      hasUserImage: !!userImageUrl,
      hasStyleImage: !!styleImageUrl,
      styleName,
      aspectRatio
    });

    // Initialize variables that will be used in both API paths
    let taskId = null;
    let result;

    // Process both images - convert base64 to public URLs if needed
    let processedUserImageUrl = userImageUrl;
    let processedStyleImageUrl = styleImageUrl;
    
    // Process user image
    if (userImageUrl.startsWith('data:') || (userImageUrl.length > 100 && !userImageUrl.startsWith('http'))) {
      console.log('📷 [NANO-BANANA] Converting user image base64 to public URL...');
      let base64WithPrefix = userImageUrl.startsWith('data:') ? userImageUrl : `data:image/png;base64,${userImageUrl}`;
      processedUserImageUrl = await uploadBase64ToPublicHost(base64WithPrefix);
      console.log('✅ [NANO-BANANA] User image converted:', processedUserImageUrl.substring(0, 50) + '...');
    }
    
    // Process style image - handle local file paths, base64, and URLs
    if (styleImageUrl.startsWith('data:') || (styleImageUrl.length > 100 && !styleImageUrl.startsWith('http'))) {
      // Handle base64 style images
      console.log('🎨 [NANO-BANANA] Converting style image base64 to public URL...');
      let base64WithPrefix = styleImageUrl.startsWith('data:') ? styleImageUrl : `data:image/png;base64,${styleImageUrl}`;
      processedStyleImageUrl = await uploadBase64ToPublicHost(base64WithPrefix);
      console.log('✅ [NANO-BANANA] Style image converted:', processedStyleImageUrl.substring(0, 50) + '...');
    } else if (styleImageUrl.startsWith('/')) {
      // Handle local file paths (starts with /) - most common case for Pet Portrait styles
      console.log(`📁 [NANO-BANANA] Processing local style image file for ${featureLabel}:`, styleImageUrl);
      
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
            processedStyleImageUrl = await uploadLocalFileToPublicHost(tryPath);
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

    // Build prompt tailored to the requested generator
    const enhancedPrompt = isActionFigure
      ? prompt
      : `Transform the pet from the first image into a painted portrait masterpiece that completely matches the artistic style, brushwork, lighting, and aesthetic of the second reference image. The pet must be rendered in the same painterly, artistic style as the clothing and background - NOT photorealistic. CRITICAL: The pet must have a FULLY CLOSED MOUTH - no open mouth, no visible tongue, no teeth showing, lips completely sealed shut in a dignified manner like classical portrait subjects. The pet should have a calm, composed facial expression with mouth firmly closed, displaying regal nobility and aristocratic bearing. The pet's face should have the same painted, artistic quality as historical portraits with soft brushstrokes and classical painting techniques. Apply the elegant ${styleName} painting style to the pet's entire form, making it look like it was painted by the same artist who created classical royal portraits. Remember: mouth must be completely closed and sealed - this is essential for the noble portrait aesthetic. No photorealistic elements - everything should be unified in one cohesive painted artistic style. ${prompt}`;
    
    if (USE_FAL_AI) {
      console.log(`🚀 [FAL.AI] Using Fal.ai nano-banana for ${featureLabel} generation...`);
      
      // Import fal client
      const { fal } = await import('@fal-ai/client');
      
      // Configure fal client
      fal.config({
        credentials: process.env.FAL_KEY
      });
      
      console.log(`🚀 [FAL.AI] ${featureLabel} request to Fal.ai nano-banana:`, {
        prompt: enhancedPrompt.substring(0, 100) + '...',
        userImageUrl: processedUserImageUrl.substring(0, 50) + '...',
        styleImageUrl: processedStyleImageUrl.substring(0, 50) + '...',
        imageCount: 2,
        num_images: 1,
        sync_mode: false
      });
      
      // Submit to Fal.ai nano-banana with dual images
      const falResult = await fal.subscribe('fal-ai/nano-banana/edit', {
        input: {
          prompt: enhancedPrompt,
          image_urls: [processedUserImageUrl, processedStyleImageUrl], // Dual images!
          num_images: 1,
          output_format: 'png',
          sync_mode: false,
          aspect_ratio: aspectRatio
        }
      });
      
      console.log('🔍 [FAL.AI] Raw response from Fal.ai:', JSON.stringify(falResult, null, 2));
      console.log(`✅ [FAL.AI] ${featureLabel} generation completed`);
      
      if (!falResult || typeof falResult !== 'object') {
        console.error('❌ [FAL.AI] Invalid response format:', falResult);
        throw new Error(`Invalid response from Fal.ai: ${typeof falResult}`);
      }
      
      // Handle Fal.ai response structure: { data: { images: [...] }, requestId: "..." }
      const images = falResult.data?.images || falResult.images;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        console.error('❌ [FAL.AI] No images in response. Available keys:', Object.keys(falResult));
        console.error('❌ [FAL.AI] Images field:', images);
        console.error('❌ [FAL.AI] Data field:', falResult.data);
        throw new Error(`No ${featureLabel} images generated by Fal.ai`);
      }
      
      // Set taskId for Fal.ai (use requestId if available)
      taskId = falResult.requestId || 'fal-ai-request';
      
      result = {
        success: true,
        url: images[0].url,
        width: images[0].width || 1024,
        height: images[0].height || 1024
      };
      
    } else {
      console.log(`🔑 [KIE API] Using KIE API nano-banana for ${featureLabel} generation...`);
      
      // Create task with KIE API using dual images
      const requestBody = {
        model: 'google/nano-banana-edit',
        input: {
          prompt: enhancedPrompt,
          image_urls: [processedUserImageUrl, processedStyleImageUrl], // Dual images!
          aspect_ratio: aspectRatio
        }
      };
      
      console.log(`🚀 [NANO-BANANA] ${featureLabel} request to KIE API:`, {
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
        throw new Error(taskResult.message || `Failed to create ${featureLabel.toLowerCase()} task`);
      }

      taskId = taskResult.data.taskId;
      console.log(`🎯 [NANO-BANANA] Created ${featureLabel} task:`, taskId);

      // Poll for task completion
      result = await pollTaskStatus(taskId);
    }

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
        console.log(`🖼️ ${featureLabel} image saved to user gallery`);
      } catch (saveError) {
        console.log(`${featureLabel} image not saved:`, saveError.message);
      }
      
      // Prepare response data in the format frontend expects
      const responseData = {
        success: true,
        imageUrl: result.url,
        generation: generation,
        remainingCredits: user.totalCredits - creditsUsed,
        message: `${featureLabel} generated successfully`,
        model: modelId,
        metadata: {
          provider: USE_FAL_AI ? 'Fal.ai' : 'KIE API',
          model: 'google/nano-banana-edit',
          mode: isActionFigure ? 'action-figure-dual-image' : 'pet-portrait-dual-image',
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
      
      console.log(`🍌 Nano-banana ${featureLabel} success! {`);
      
      // Send success response
      return res.status(200).json(responseData);
    } else {
      throw new Error(result.error || `${featureLabel} generation failed`);
    }

  } catch (error) {
    console.error(`❌ [NANO-BANANA] ${featureLabel} error:`, error.message);
    logAIServiceError(error, 'Nano-Banana', 'generatePetPortrait');
    
    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }
    
    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, `Nano-Banana ${featureLabel} generation failed`);
      } catch (refundError) {
        console.error(`Failed to refund ${featureLabel} credits:`, refundError);
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
      baseImageUrl = await uploadBase64ToPublicHost(base64WithPrefix);
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
