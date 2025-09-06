import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';
import { fal } from '@fal-ai/client';

// Fal.ai Configuration
const FAL_KEY = process.env.FAL_KEY || process.env.FAL_AI_API_KEY;

// Configure Fal.ai client
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY
  });
  console.log('🚀 Fal.ai configured:', {
    hasKey: !!FAL_KEY,
    keyLength: FAL_KEY?.length,
    modelEndpoint: 'fal-ai/nano-banana/edit'
  });
} else {
  console.warn('⚠️ FAL_KEY not found - Fal.ai nano-banana will not work');
}

/**
 * Generate Pet Portrait using Fal.ai nano-banana/edit
 * Supports multiple images with Gemini-powered editing
 */
export const generatePetPortrait = asyncHandler(async (req, res) => {
  const { userImageUrl, styleImageUrl, styleName, prompt, aspectRatio = '1:1', num_images = 1 } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate pet portraits');
  }

  // Validate required fields
  if (!prompt || !userImageUrl || !styleImageUrl) {
    return sendBadRequest(res, 'Prompt, user image, and style image are required for pet portraits');
  }

  // Check if FAL_KEY is configured
  if (!FAL_KEY) {
    return sendServerError(res, 'Fal.ai service is not configured. Please contact support.');
  }

  const modelId = 'fal-ai-nano-banana';
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

    console.log('🎨 [FAL.AI] Pet Portrait generation request:', {
      hasPrompt: !!prompt,
      hasUserImage: !!userImageUrl,
      hasStyleImage: !!styleImageUrl,
      styleName,
      aspectRatio,
      num_images,
      generationId: generation.id
    });

    // Enhanced prompt for Pet Portrait with style transfer
    const enhancedPrompt = `Transform the pet from the first image into a painted portrait masterpiece that completely matches the artistic style, brushwork, lighting, and aesthetic of the second reference image. The pet must be rendered in the same painterly, artistic style as the clothing and background - NOT photorealistic. CRITICAL: The pet must have a FULLY CLOSED MOUTH - no open mouth, no visible tongue, no teeth showing, lips completely sealed shut in a dignified manner like classical portrait subjects. The pet should have a calm, composed facial expression with mouth firmly closed, displaying regal nobility and aristocratic bearing. The pet's face should have the same painted, artistic quality as historical portraits with soft brushstrokes and classical painting techniques. Apply the elegant ${styleName} painting style to the pet's entire form, making it look like it was painted by the same artist who created classical royal portraits. Remember: mouth must be completely closed and sealed - this is essential for the noble portrait aesthetic. No photorealistic elements - everything should be unified in one cohesive painted artistic style. ${prompt}`;

    // Prepare image URLs array
    const imageUrls = [userImageUrl, styleImageUrl];
    
    console.log('🚀 [FAL.AI] Submitting Pet Portrait request:', {
      model: 'fal-ai/nano-banana/edit',
      prompt: enhancedPrompt.substring(0, 100) + '...',
      imageCount: imageUrls.length,
      num_images,
      userImagePreview: userImageUrl.substring(0, 50) + '...',
      styleImagePreview: styleImageUrl.substring(0, 50) + '...'
    });

    // Submit request to Fal.ai with subscribe (auto-waits for completion)
    const result = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt: enhancedPrompt,
        image_urls: imageUrls,
        num_images: num_images,
        output_format: 'png',
        sync_mode: false // Return URLs, not data URIs
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`🔄 [FAL.AI] Queue update: ${update.status}`);
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((logMessage) => {
            console.log(`📝 [FAL.AI] ${logMessage}`);
          });
        }
      },
    });

    console.log('✅ [FAL.AI] Pet Portrait generation completed:', {
      requestId: result.requestId,
      hasImages: !!result.data?.images?.length,
      imageCount: result.data?.images?.length || 0,
      hasDescription: !!result.data?.description
    });

    if (result.data?.images?.length > 0) {
      const firstImage = result.data.images[0];
      const imageUrl = firstImage.url;
      const description = result.data.description || 'Pet portrait generated successfully';

      // Update generation status
      await completeGeneration(generation.id);

      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { 
            url: imageUrl, 
            width: 1024, 
            height: 1024,
            contentType: firstImage.content_type || 'image/png',
            fileName: firstImage.file_name || 'pet_portrait.png',
            fileSize: firstImage.file_size
          },
          user,
          generation
        );
        console.log('🖼️ [FAL.AI] Pet Portrait image saved to user gallery');
      } catch (saveError) {
        console.log('⚠️ [FAL.AI] Pet Portrait image not saved:', saveError.message);
      }

      // Prepare response data in the format frontend expects
      const responseData = {
        success: true,
        imageUrl: imageUrl,
        generation: generation,
        remainingCredits: user.totalCredits - creditsUsed,
        message: description,
        model: modelId,
        metadata: {
          provider: 'Fal.ai',
          model: 'nano-banana/edit',
          mode: 'pet-portrait-dual-image',
          styleName,
          requestId: result.requestId,
          geminiDescription: description,
          imageCount: result.data.images.length,
          outputFormat: 'png'
        }
      };

      console.log('🍌 [FAL.AI] Pet Portrait success response:', {
        success: responseData.success,
        hasImageUrl: !!responseData.imageUrl,
        imageUrlPreview: responseData.imageUrl?.substring(0, 50) + '...',
        remainingCredits: responseData.remainingCredits,
        requestId: result.requestId
      });

      // Send success response
      return res.status(200).json(responseData);
    } else {
      throw new Error('No images generated by Fal.ai nano-banana service');
    }

  } catch (error) {
    console.error('❌ [FAL.AI] Pet Portrait error:', error.message);
    logAIServiceError(error, 'Fal.ai nano-banana', 'generatePetPortrait');

    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }

    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Fal.ai Pet Portrait generation failed');
        console.log('💰 [FAL.AI] Refunded credits after failure:', creditsUsed);
      } catch (refundError) {
        console.error('❌ [FAL.AI] Failed to refund Pet Portrait credits:', refundError);
      }
    }

    // Check for specific error types
    if (error.statusCode === 400) {
      return sendBadRequest(res, error.message, error.details);
    }

    if (error.statusCode === 401) {
      return sendUnauthorized(res, 'Invalid Fal.ai API key or insufficient permissions');
    }

    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Fal.ai nano-banana');
    return sendServerError(res, userFriendlyMessage, {
      details: error.message,
      provider: 'Fal.ai',
      model: 'nano-banana/edit'
    });
  }
});

/**
 * Generate image with Fal.ai nano-banana (general image editing)
 * Supports multiple input images with custom prompts
 */
export const generateImage = asyncHandler(async (req, res) => {
  const { prompt, image_urls, num_images = 1, output_format = 'png' } = req.body;
  const userId = req.user?.id;

  // Require authentication
  if (!userId) {
    return sendUnauthorized(res, 'Please sign in to generate images');
  }

  // Validate required fields
  if (!prompt || !image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
    return sendBadRequest(res, 'Prompt and at least one image URL are required');
  }

  // Check if FAL_KEY is configured
  if (!FAL_KEY) {
    return sendServerError(res, 'Fal.ai service is not configured. Please contact support.');
  }

  const modelId = 'fal-ai-nano-banana';
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

    console.log('🎨 [FAL.AI] General image editing request:', {
      hasPrompt: !!prompt,
      imageCount: image_urls.length,
      num_images,
      output_format,
      generationId: generation.id
    });

    // Submit request to Fal.ai
    const result = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt: prompt,
        image_urls: image_urls,
        num_images: num_images,
        output_format: output_format,
        sync_mode: false
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`🔄 [FAL.AI] Queue update: ${update.status}`);
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((logMessage) => {
            console.log(`📝 [FAL.AI] ${logMessage}`);
          });
        }
      },
    });

    if (result.data?.images?.length > 0) {
      const firstImage = result.data.images[0];
      const imageUrl = firstImage.url;

      // Update generation status
      await completeGeneration(generation.id);

      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { 
            url: imageUrl, 
            width: 1024, 
            height: 1024,
            contentType: firstImage.content_type || `image/${output_format}`,
            fileName: firstImage.file_name || `edited_image.${output_format}`,
            fileSize: firstImage.file_size
          },
          user,
          generation
        );
        console.log('🖼️ [FAL.AI] Image saved to user gallery');
      } catch (saveError) {
        console.log('⚠️ [FAL.AI] Image not saved:', saveError.message);
      }

      // Send success response in the format frontend expects
      return res.status(200).json({
        success: true,
        image: imageUrl,
        thumbnailUrl: imageUrl,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: {
          provider: 'Fal.ai',
          model: 'nano-banana/edit',
          mode: 'general-editing',
          requestId: result.requestId,
          description: result.data.description || 'Image edited successfully',
          imageCount: result.data.images.length,
          outputFormat: output_format
        }
      });
    } else {
      throw new Error('No images generated by Fal.ai nano-banana service');
    }

  } catch (error) {
    console.error('❌ [FAL.AI] General image editing error:', error.message);
    logAIServiceError(error, 'Fal.ai nano-banana', 'generateImage');

    // If generation was created but failed, update its status
    if (generation) {
      await failGeneration(generation.id, error.message);
    }

    // If credits were deducted but generation failed, refund them
    if (creditsUsed > 0 && userId) {
      try {
        await refundCredits(userId, creditsUsed, 'Fal.ai image generation failed');
        console.log('💰 [FAL.AI] Refunded credits after failure:', creditsUsed);
      } catch (refundError) {
        console.error('❌ [FAL.AI] Failed to refund credits:', refundError);
      }
    }

    // Send user-friendly error
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Fal.ai nano-banana');
    return sendServerError(res, userFriendlyMessage, {
      details: error.message,
      provider: 'Fal.ai',
      model: 'nano-banana/edit'
    });
  }
});

/**
 * Check Fal.ai service status
 */
export const getServiceStatus = asyncHandler(async (req, res) => {
  try {
    const status = {
      service: 'Fal.ai nano-banana',
      configured: !!FAL_KEY,
      endpoint: 'fal-ai/nano-banana/edit',
      features: [
        'Multiple image editing',
        'Gemini-powered descriptions',
        'Pet Portrait generation',
        'Custom style transfer',
        'PNG/JPEG output formats',
        'Base64 and URL input support'
      ],
      ready: !!FAL_KEY
    };

    return sendSuccess(res, status);
  } catch (error) {
    console.error('❌ [FAL.AI] Status check error:', error);
    return sendServerError(res, 'Failed to check Fal.ai service status');
  }
});