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
 * Generate image with GPT IMAGE using KIE.ai API (Image Editing)
 * Fixed to use correct KIE.ai API format with IMGBB conversion
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
    console.log('🎨 [GPT IMAGE] Starting image editing generation...');
    console.log('🎯 [GPT IMAGE] Prompt:', prompt);
    console.log('🎯 [GPT IMAGE] Aspect Ratio:', aspectRatio);
    
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

    // Process base64 image to public URL (IMGBB conversion like Qwen)
    console.log('🎯 [GPT IMAGE] Converting base64 to public URL...');
    const publicImageUrl = await uploadBase64ToImgbb(input_image);
    console.log('✅ [GPT IMAGE] Image converted to public URL:', publicImageUrl);

    // Map aspect ratios to GPT Image supported formats
    let gptImageSize = mapAspectRatio(aspectRatio);
    
    console.log('🎯 [GPT IMAGE] Request details:', { 
      style, 
      originalAspectRatio: aspectRatio,
      mappedSize: gptImageSize, 
      hasPrompt: !!prompt, 
      hasPublicImageUrl: !!publicImageUrl
    });

    // Prepare request body for KIE.ai GPT Image API
    const requestBody = {
      prompt: prompt,
      filesUrl: [publicImageUrl], // Use filesUrl array format as per API doc
      size: gptImageSize,
      nVariants: 1,
      isEnhance: false,
      enableFallback: false
    };

    console.log('🔍 [GPT IMAGE] API Request Body:', JSON.stringify(requestBody, null, 2));

    // Make API request to KIE.ai
    const response = await axios.post(GPT_IMAGE_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('🔍 [GPT IMAGE] API Response:', JSON.stringify(response.data, null, 2));

    // Check if we got a task ID (async processing)
    if (response.data?.code === 200 && response.data?.data?.taskId) {
      const taskId = response.data.data.taskId;
      console.log('🔄 [GPT IMAGE] Task created, ID:', taskId);
      
      // Poll for results using KIE.ai polling
      const result = await pollGPTImageTask(taskId);
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Process result and save to Cloudinary
      const imageUrl = result.resultUrls[0];
      console.log('✅ [GPT IMAGE] Generated image URL:', imageUrl);
      
      // Try to save the generated image
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('📦 [GPT IMAGE] Image saved to gallery');
      } catch (saveError) {
        console.log('⚠️ [GPT IMAGE] Image save failed:', saveError.message);
      }
      
      // Send success response
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
      throw new Error(`GPT Image API error: ${response.data?.msg || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ [GPT IMAGE] Generation error:', error);
    
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
 * Generate image without input image (text-to-image) using KIE.ai GPT Image API
 * Fixed to use correct KIE.ai API format
 */
export const generateImageWithoutInput = asyncHandler(async (req, res) => {
  const { prompt, style, aspectRatio = '1:1' } = req.body;
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
    console.log('🎨 [GPT IMAGE TEXT] Starting text-to-image generation...');
    console.log('🎯 [GPT IMAGE TEXT] Prompt:', prompt);
    
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
    console.log('📐 [GPT IMAGE TEXT] Aspect ratio mapping:', aspectRatio, '->', gptImageSize);

    // Prepare request for KIE.ai GPT Image text-to-image API
    const requestBody = {
      prompt: prompt,
      size: gptImageSize,
      nVariants: 1,
      isEnhance: false,
      enableFallback: false
    };

    console.log('🔍 [GPT IMAGE TEXT] API Request Body:', JSON.stringify(requestBody, null, 2));

    // Make API request to KIE.ai
    const response = await axios.post(GPT_IMAGE_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('🔍 [GPT IMAGE TEXT] API Response:', JSON.stringify(response.data, null, 2));

    // Check if we got a task ID (async processing)
    if (response.data?.code === 200 && response.data?.data?.taskId) {
      const taskId = response.data.data.taskId;
      console.log('🔄 [GPT IMAGE TEXT] Task created, ID:', taskId);
      
      // Poll for results using KIE.ai polling
      const result = await pollGPTImageTask(taskId);
      
      // Update generation status
      await completeGeneration(generation.id);
      
      // Process result
      const imageUrl = result.resultUrls[0];
      console.log('✅ [GPT IMAGE TEXT] Generated image URL:', imageUrl);
      
      // Try to save the generated image
      let savedImageData = null;
      try {
        savedImageData = await saveGeneratedImage(
          { url: imageUrl, width: 1024, height: 1024 },
          user,
          generation
        );
        console.log('📦 [GPT IMAGE TEXT] Image saved to gallery');
      } catch (saveError) {
        console.log('⚠️ [GPT IMAGE TEXT] Image save failed:', saveError.message);
      }
      
      // Send success response
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
      throw new Error(`GPT Image API error: ${response.data?.msg || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ [GPT IMAGE TEXT] Generation error:', error);
    
    // Log the error
    logAIServiceError(error, 'GPT IMAGE TEXT', 'generateImageWithoutInput');
    
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
    const userFriendlyMessage = getUserFriendlyAIError(error, 'GPT IMAGE TEXT');
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
 * Upload base64 image to IMGBB (same as Qwen implementation)
 * KIE.ai API requires public URLs, not base64 data
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
 * Poll GPT Image task status until completion
 * Uses KIE.ai record-info endpoint
 */
async function pollGPTImageTask(taskId, maxAttempts = 30) {
  console.log(`🔄 [GPT IMAGE POLL] Starting polling for task: ${taskId}`);
  
  const queryUrl = 'https://api.kie.ai/api/v1/gpt4o-image/record-info';
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📡 [GPT IMAGE POLL] Attempt ${attempt}/${maxAttempts}`);
      
      const response = await axios.get(queryUrl, {
        params: { taskId },
        headers: {
          'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`📊 [GPT IMAGE POLL] Response code: ${response.data?.code}`);
      
      if (response.data && response.data.code === 200) {
        const data = response.data.data;
        console.log('📊 [GPT IMAGE POLL] Task data:', {
          successFlag: data?.successFlag,
          status: data?.status,
          progress: data?.progress,
          hasResponse: !!data?.response,
          hasResultUrls: !!data?.response?.resultUrls?.length
        });
        
        // Check success flag (1 = Success, 0 = Processing, 2 = Failed)
        if (data.successFlag === 1 && data.response?.resultUrls?.length > 0) {
          console.log('✅ [GPT IMAGE POLL] Task completed successfully!');
          return data.response;
        } else if (data.successFlag === 2) {
          throw new Error(`GPT Image generation failed: ${data.errorMessage || 'Unknown error'}`);
        } else if (data.successFlag === 0) {
          console.log('⏳ [GPT IMAGE POLL] Task still processing...');
          if (data.progress) {
            const progress = (parseFloat(data.progress) * 100).toFixed(1);
            console.log(`📈 [GPT IMAGE POLL] Progress: ${progress}%`);
          }
        } else {
          console.log(`📝 [GPT IMAGE POLL] Unknown success flag: ${data.successFlag}`);
        }
      } else {
        console.log(`⚠️ [GPT IMAGE POLL] Unexpected response code: ${response.data?.code}`);
      }

      // Check timeout (3 minutes max)
      const elapsed = Date.now() - startTime;
      if (elapsed > 180000) {
        throw new Error('GPT Image polling timed out after 3 minutes');
      }

      // Progressive delay
      const delay = attempt < 10 ? 3000 : attempt < 20 ? 5000 : 8000;
      console.log(`⏳ [GPT IMAGE POLL] Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
        
    } catch (error) {
      console.error(`⚠️ [GPT IMAGE POLL] Polling attempt ${attempt} error:`, error.message);
      
      if (error.response?.data) {
        console.error('❌ [GPT IMAGE POLL] Error response:', error.response.data);
      }
      
      // Don't throw on network errors, just continue polling
      if (attempt === maxAttempts) {
        throw new Error(`GPT Image polling failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retry on error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('GPT Image polling timed out after maximum attempts');
}