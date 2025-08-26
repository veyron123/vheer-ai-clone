import { PrismaClient } from '@prisma/client';
import { GPTImageTextToImageService } from '../services/GPTImageTextToImageService.js';
import { saveGeneratedImage } from './images.controller.js';
import axios from 'axios';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

const prisma = new PrismaClient();
const gptImageService = new GPTImageTextToImageService();

console.log('GPT Image Text-to-Image controller initialized');

/**
 * Generate image with GPT Image model (pure text-to-image)
 */
export const generateTextToImage = async (req, res) => {
  let generation = null;
  
  try {
    const { prompt, style, aspectRatio = '1:1', negativePrompt, numImages = 1 } = req.body;
    const userId = req.user?.id;

    console.log('🎨 Starting GPT Image text-to-image generation:', { prompt, style, aspectRatio, numImages });

    // Check credits if user is authenticated
    if (userId) {
      const modelId = 'gpt-image';
      const requiredCredits = 30; // Fixed cost for GPT Image
      
      try {
        const creditCheckResponse = await axios.post('http://localhost:5000/api/users/check-credits', {
          modelId
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });

        if (!creditCheckResponse.data.canAfford) {
          return res.status(400).json({ 
            error: 'Insufficient credits',
            required: requiredCredits,
            available: creditCheckResponse.data.available,
            modelId
          });
        }
      } catch (creditError) {
        console.log('Credit check failed, proceeding for testing:', creditError.message);
      }
    }

    // Create generation record only for authenticated users
    if (userId) {
      generation = await prisma.generation.create({
        data: {
          userId: userId,
          prompt,
          negativePrompt: negativePrompt || '',
          model: 'gpt-image',
          style: style || 'none',
          creditsUsed: 30,
          status: 'processing'
        }
      });
    }

    // Build final prompt based on style
    let finalPrompt = prompt;
    if (style && style !== 'custom' && style !== 'none') {
      finalPrompt = `${prompt} in ${style} style`;
    }

    // Generate image using pure text-to-image API
    const result = await gptImageService.generateImage(finalPrompt, {
      aspectRatio,
      negativePrompt: negativePrompt || '',
      numImages: Math.min(numImages, 4),
      isEnhance: false
    });

    // Update generation with results
    if (generation?.id) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    }

    // Deduct credits if user is authenticated
    if (userId) {
      try {
        await axios.post('http://localhost:5000/api/users/deduct-credits', {
          modelId: 'gpt-image'
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        console.log('✅ Credits deducted for GPT Image text-to-image generation');
      } catch (creditError) {
        console.log('Credit deduction failed (but generation succeeded):', creditError.message);
      }
    }

    // Save image if user is authenticated and eligible
    let savedImage = null;
    if (userId && req.user) {
      try {
        savedImage = await saveGeneratedImage(result.images[0], req.user, generation);
      } catch (saveError) {
        console.log('Image save failed (but generation succeeded):', saveError.message);
      }
    }

    console.log('✅ GPT Image text-to-image generation completed successfully');

    res.json({
      success: true,
      images: result.images,
      prompt: result.prompt,
      model: 'gpt-image',
      generation_id: generation?.id || null,
      saved_image: savedImage,
      seed: result.seed,
      timings: result.timings
    });

  } catch (error) {
    logAIServiceError(error, 'GPT Image', 'Text-to-image generation');
    const userFriendlyMessage = getUserFriendlyAIError(error, 'GPT Image');
    
    // Update generation status to failed if it exists
    try {
      if (typeof generation !== 'undefined' && generation?.id) {
        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: 'failed',
            error: error.message
          }
        });
      }
    } catch (updateError) {
      console.error('Failed to update generation status:', updateError);
    }

    res.status(500).json({
      error: userFriendlyMessage,
      message: error.message,
      model: 'gpt-image'
    });
  }
};