import { GoogleGenerativeAI } from '@google/genai';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import { createGeneration, completeGeneration, failGeneration } from '../services/generationService.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendServerError, asyncHandler } from '../utils/responses.js';
import { saveGeneratedImage } from './images.controller.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate image with Nano-Banana (Gemini)
 * Refactored to use unified services
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
      aspectRatio
    });

    // Process with Gemini Pro Vision
    const result = await processWithGemini(prompt, input_image);

    if (result.success && result.data?.url) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: result.data.url, width: 1024, height: 1024 },
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
        image: result.data.url,
        thumbnailUrl: result.data.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId,
        metadata: result.data.metadata
      });
    } else {
      throw new Error(result.error || 'Failed to generate image');
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
 * Generate with prompt only (text-to-image)
 * Refactored to use unified services
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

    // Generate with Gemini (text only)
    const result = await generateWithGeminiText(prompt);

    if (result.success && result.data?.url) {
      // Update generation status
      await completeGeneration(generation.id);
      
      // Try to save the generated image
      try {
        await saveGeneratedImage(
          { url: result.data.url, width: 1024, height: 1024 },
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
        image: result.data.url,
        thumbnailUrl: result.data.url,
        credits: {
          used: creditsUsed,
          remaining: user.totalCredits - creditsUsed
        },
        model: modelId
      });
    } else {
      throw new Error(result.error || 'Failed to generate image');
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

/**
 * Process image with Gemini Pro Vision
 */
async function processWithGemini(prompt, imageBase64) {
  try {
    console.log('Processing with Gemini Pro Vision...');
    
    // Use gemini-1.5-flash for faster processing
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: 'image/jpeg'
      }
    };
    
    // Create an enhanced prompt for image transformation
    const enhancedPrompt = `Based on this image, create a detailed description for an AI image generator to create a new image with the following modifications: ${prompt}. 
    Describe the style, composition, colors, lighting, and mood in detail. 
    Make the description vivid and specific enough for an AI to recreate the vision.`;
    
    // Generate content with Gemini
    const result = await model.generateContent([enhancedPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);
    
    // For now, return a mock successful response
    // In production, you would use the Gemini response to generate an actual image
    return {
      success: true,
      data: {
        url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.slice(0, 50))}`,
        metadata: {
          geminiResponse: text.slice(0, 200) + '...',
          model: 'gemini-1.5-flash'
        }
      }
    };
  } catch (error) {
    console.error('Gemini processing error:', error);
    throw error;
  }
}

/**
 * Generate with Gemini text-only
 */
async function generateWithGeminiText(prompt) {
  try {
    console.log('Generating with Gemini text model...');
    
    // Use gemini-pro for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create an enhanced prompt
    const enhancedPrompt = `Create a detailed description for an AI image generator based on this prompt: "${prompt}". 
    Include specific details about style, composition, colors, lighting, mood, and any important elements. 
    Make it vivid and descriptive enough for an AI to create a stunning image.`;
    
    // Generate content
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini text response:', text.slice(0, 200) + '...');
    
    // Return mock successful response
    return {
      success: true,
      data: {
        url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.slice(0, 50))}`,
        metadata: {
          geminiResponse: text.slice(0, 200) + '...',
          model: 'gemini-pro'
        }
      }
    };
  } catch (error) {
    console.error('Gemini text generation error:', error);
    throw error;
  }
}