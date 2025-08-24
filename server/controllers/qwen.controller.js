import { PrismaClient } from '@prisma/client';
import { QwenImageService } from '../services/QwenImageService.js';
import { getModelCredits } from '../config/pricing.config.js';
import { saveGeneratedImage } from './images.controller.js';
import axios from 'axios';

const prisma = new PrismaClient();
const qwenService = new QwenImageService();

console.log('Qwen Image controller initialized');

/**
 * Generate image with Qwen Image model (text-to-image)
 */
export const generateImage = async (req, res) => {
  let generation = null;
  
  try {
    const { 
      prompt, 
      style, 
      aspectRatio = '1:1', 
      negativePrompt, 
      seed, 
      baseImage, 
      mode = 'text-to-image',
      numInferenceSteps = 30,
      guidanceScale = 4,
      numImages = 1,
      outputFormat = 'png',
      acceleration = 'regular',
      enableSafetyChecker = true,
      syncMode = true
    } = req.body;
    const userId = req.user?.id;

    console.log('🎨 Starting Qwen Image generation:', { prompt, style, aspectRatio, mode });

    // Check credits if user is authenticated
    if (userId) {
      const modelId = 'qwen-image';
      const creditsPerImage = 20; // 20 кредитов за изображение
      const requiredCredits = creditsPerImage * (numImages || 1); // Умножаем на количество изображений
      
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
          negativePrompt: negativePrompt || 'blurry, ugly, low quality',
          model: 'qwen-image',
          style: style || 'none',
          creditsUsed: requiredCredits,
          status: 'processing'
        }
      });
    }

    // Build final prompt based on style
    let finalPrompt = prompt;
    if (style && style !== 'custom' && style !== 'none') {
      finalPrompt = `${prompt} in ${style} style`;
    }

    // Generate image based on mode
    let result;
    if (mode === 'image-to-image' && baseImage) {
      console.log('🖼️ Using image-to-image mode');
      result = await qwenService.editImage(baseImage, finalPrompt, {
        aspectRatio,
        negativePrompt: negativePrompt || 'blurry, ugly, low quality',
        seed: seed ? parseInt(seed) : undefined,
        numInferenceSteps,
        guidanceScale,
        numImages,
        outputFormat,
        acceleration,
        enableSafetyChecker,
        syncMode
      });
    } else {
      console.log('📝 Using text-to-image mode');
      result = await qwenService.generateImage(finalPrompt, {
        aspectRatio,
        negativePrompt: negativePrompt || 'blurry, ugly, low quality',
        seed: seed ? parseInt(seed) : undefined,
        numInferenceSteps,
        guidanceScale,
        numImages,
        outputFormat,
        acceleration,
        enableSafetyChecker,
        syncMode
      });
    }

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
          modelId: 'qwen-image'
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        console.log('✅ Credits deducted for qwen-image generation');
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

    console.log('✅ Qwen Image generation completed successfully');

    res.json({
      success: true,
      images: result.images,
      prompt: result.prompt,
      model: 'qwen-image',
      generation_id: generation?.id || null,
      saved_image: savedImage,
      seed: result.seed,
      timings: result.timings
    });

  } catch (error) {
    console.error('❌ Qwen Image generation error:', error);
    
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
      error: 'Image generation failed',
      message: error.message,
      model: 'qwen-image'
    });
  }
};

/**
 * Edit image with Qwen Image model (image-to-image)
 */
export const editImage = async (req, res) => {
  let generation = null;
  
  try {
    const { 
      prompt, 
      input_image, 
      style, 
      aspectRatio = 'match', 
      negativePrompt, 
      seed,
      numInferenceSteps = 30,
      guidanceScale = 4,
      numImages = 1,
      outputFormat = 'png',
      acceleration = 'regular',
      enableSafetyChecker = true,
      syncMode = true
    } = req.body;
    const userId = req.user?.id;

    console.log('🎨 Starting Qwen Image editing:', { prompt, style, aspectRatio });

    if (!input_image) {
      return res.status(400).json({ error: 'Input image is required for image editing' });
    }

    // Define credits calculation
    const modelId = 'qwen-image';
    const creditsPerImage = 20; // 20 кредитов за изображение
    const requiredCredits = creditsPerImage * (numImages || 1); // Умножаем на количество изображений

    // Check credits if user is authenticated
    if (userId) {
      
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
          negativePrompt: negativePrompt || 'blurry, ugly, low quality',
          model: 'qwen-image',
          style: style || 'none',
          creditsUsed: requiredCredits,
          status: 'processing'
        }
      });
    }

    // Build final prompt based on style
    let finalPrompt = prompt;
    if (style && style !== 'custom' && style !== 'none') {
      finalPrompt = `${prompt} in ${style} style`;
    }

    // Edit image
    const result = await qwenService.editImage(input_image, finalPrompt, {
      aspectRatio,
      negativePrompt: negativePrompt || 'blurry, ugly, low quality',
      seed: seed ? parseInt(seed) : undefined,
      numInferenceSteps,
      guidanceScale,
      numImages,
      outputFormat,
      acceleration,
      enableSafetyChecker,
      syncMode
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
          modelId: 'qwen-image'
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        console.log('✅ Credits deducted for qwen-image editing');
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

    console.log('✅ Qwen Image editing completed successfully');

    res.json({
      success: true,
      images: result.images,
      prompt: result.prompt,
      model: 'qwen-image',
      generation_id: generation?.id || null,
      saved_image: savedImage,
      seed: result.seed,
      timings: result.timings
    });

  } catch (error) {
    console.error('❌ Qwen Image editing error:', error);
    
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
      error: 'Image editing failed',
      message: error.message,
      model: 'qwen-image'
    });
  }
};