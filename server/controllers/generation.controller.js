import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { getStorageProvider } from '../utils/storageProvider.js';
import { shouldSaveImageForUser } from '../utils/imageStorage.js';
import { AppError } from '../middleware/error.middleware.js';
import { checkAndDeductCredits, refundCredits } from '../services/creditService.js';
import axios from 'axios';

const prisma = new PrismaClient();

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Model configurations
const MODELS = {
  'stable-diffusion-xl': {
    name: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    creditsPerImage: 1
  },
  'kandinsky': {
    name: 'ai-forever/kandinsky-2.2:ea1addaab376f4dc227f5368bbd8eff901820fd1cc14ed8cad63b29249e9d463',
    creditsPerImage: 1
  },
  'openjourney': {
    name: 'prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
    creditsPerImage: 1
  },
  'realistic-vision': {
    name: 'lucataco/realistic-vision-v5:a8e8b6846cea937cf424e2fb079f1a03b3a95d69093dcba5e47f4e92a99acc1f',
    creditsPerImage: 2
  },
  'anime': {
    name: 'cjwbw/anything-v3-better-vae:09a5805203f4c12da649ec1923bb7729517ca25fcac790e640eaa9ed66573b65',
    creditsPerImage: 1
  }
};

// Style presets
const STYLE_PRESETS = {
  'pop-art': 'pop art style, vibrant colors, bold outlines',
  'black-white-comic': 'black and white comic book style, high contrast',
  'modern-fashion': 'modern fashion photography, professional lighting',
  'high-fashion': 'high fashion editorial, luxury brand aesthetic',
  'minimalist': 'minimalist design, clean lines, simple composition',
  'pointillism': 'pointillism art style, dot technique',
  'digital-avatar': 'digital avatar, profile picture, clean background',
  'anime-manga': 'anime manga style, japanese art',
  'tattoo-design': 'tattoo design, black ink, traditional style',
  'product-photo': 'product photography, white background, professional',
  'wallpaper': 'wallpaper design, seamless pattern, decorative'
};

export const generateImage = async (req, res, next) => {
  try {
    const {
      prompt,
      negativePrompt = '',
      model = 'stable-diffusion-xl',
      style = null,
      width = 1024,
      height = 1024,
      numOutputs = 1,
      guidanceScale = 7.5,
      numInferenceSteps = 50,
      seed = null
    } = req.body;
    
    // Check if model exists
    if (!MODELS[model]) {
      throw new AppError('Invalid model selected', 400);
    }
    
    const modelConfig = MODELS[model];
    const creditsNeeded = modelConfig.creditsPerImage * numOutputs;
    
    // Check credits
    const userCredits = await prisma.credit.aggregate({
      where: { userId: req.user.id },
      _sum: { amount: true }
    });
    
    const totalCredits = userCredits._sum.amount || 0;
    
    if (totalCredits < creditsNeeded) {
      throw new AppError('Insufficient credits', 403);
    }
    
    // Apply style preset if provided
    let finalPrompt = prompt;
    if (style && STYLE_PRESETS[style]) {
      finalPrompt = `${prompt}, ${STYLE_PRESETS[style]}`;
    }
    
    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: req.user.id,
        prompt: finalPrompt,
        negativePrompt,
        model,
        style,
        batchSize: numOutputs,
        status: 'PROCESSING',
        creditsUsed: creditsNeeded
      }
    });
    
    try {
      // Generate image using Replicate
      const output = await replicate.run(
        modelConfig.name,
        {
          input: {
            prompt: finalPrompt,
            negative_prompt: negativePrompt,
            width,
            height,
            num_outputs: numOutputs,
            guidance_scale: guidanceScale,
            num_inference_steps: numInferenceSteps,
            ...(seed && { seed })
          }
        }
      );
      
      // Upload images using StorageProvider and save to database
      const uploadedImages = [];
      const storageProvider = getStorageProvider();
      
      // Check if user should have images saved to "My Images"
      const shouldSaveToGallery = shouldSaveImageForUser(req.user);
      
      for (const imageUrl of output) {
        let uploadResult = null;
        let thumbnailResult = null;
        let cloudPath = null;
        
        // Only upload to storage if user has access to "My Images"
        if (shouldSaveToGallery) {
          // Upload image using universal storage provider
          uploadResult = await storageProvider.uploadImage(imageUrl, 'generated');
          
          // Generate thumbnail
          thumbnailResult = await storageProvider.generateThumbnail(uploadResult.url);
          cloudPath = uploadResult.path;
        }
        
        // Save image to database (always save for Generation History)
        const image = await prisma.image.create({
          data: {
            userId: req.user.id,
            generationId: generation.id,
            url: shouldSaveToGallery ? uploadResult.url : imageUrl,
            thumbnailUrl: shouldSaveToGallery ? thumbnailResult.url : null,
            prompt: finalPrompt,
            negativePrompt,
            model,
            style,
            width,
            height,
            seed: seed || null,
            steps: numInferenceSteps,
            guidance: guidanceScale,
            isPublic: false,
            // Store cloud path for deletion (only if uploaded to storage)
            cloudPath: cloudPath
          }
        });
        
        uploadedImages.push(image);
      }
      
      // Update generation status
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      // Deduct credits
      await prisma.credit.create({
        data: {
          userId: req.user.id,
          amount: -creditsNeeded,
          type: 'USAGE',
          description: `Generated ${numOutputs} image(s) using ${model}`
        }
      });
      
      res.json({
        message: 'Images generated successfully',
        generation: {
          id: generation.id,
          status: 'COMPLETED',
          creditsUsed: creditsNeeded
        },
        images: uploadedImages,
        remainingCredits: totalCredits - creditsNeeded
      });
      
    } catch (error) {
      // Update generation status to failed
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });
      
      throw new AppError('Failed to generate image', 500);
    }
  } catch (error) {
    next(error);
  }
};

export const getGenerationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const generation = await prisma.generation.findUnique({
      where: { id },
      include: {
        images: true
      }
    });
    
    if (!generation) {
      throw new AppError('Generation not found', 404);
    }
    
    if (generation.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }
    
    res.json(generation);
  } catch (error) {
    next(error);
  }
};

export const getUserGenerations = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      model, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause with filters
    const where = { 
      userId: req.user.id,
      ...(status && { status }),
      ...(model && { model }),
      ...(search && {
        OR: [
          { prompt: { contains: search, mode: 'insensitive' } },
          { negativePrompt: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    
    // Build orderBy clause
    const orderBy = { [sortBy]: sortOrder };
    
    const [generations, total, stats] = await Promise.all([
      prisma.generation.findMany({
        where,
        include: {
          images: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              width: true,
              height: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.generation.count({ where }),
      // Get user stats
      prisma.generation.aggregate({
        where: { userId: req.user.id },
        _count: { id: true },
        _sum: { creditsUsed: true }
      })
    ]);
    
    // Get status breakdown
    const statusBreakdown = await prisma.generation.groupBy({
      by: ['status'],
      where: { userId: req.user.id },
      _count: { id: true }
    });
    
    // Get model usage breakdown
    const modelBreakdown = await prisma.generation.groupBy({
      by: ['model'],
      where: { userId: req.user.id },
      _count: { id: true },
      _sum: { creditsUsed: true }
    });
    
    res.json({
      generations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalGenerations: stats._count.id || 0,
        totalCreditsUsed: stats._sum.creditsUsed || 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        modelBreakdown: modelBreakdown.map(item => ({
          model: item.model,
          count: item._count.id,
          creditsUsed: item._sum.creditsUsed || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableModels = async (req, res) => {
  const models = Object.keys(MODELS).map(key => ({
    id: key,
    name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    creditsPerImage: MODELS[key].creditsPerImage
  }));
  
  res.json(models);
};

export const getAvailableStyles = async (req, res) => {
  const styles = Object.keys(STYLE_PRESETS).map(key => ({
    id: key,
    name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: STYLE_PRESETS[key]
  }));
  
  res.json(styles);
};

// Regenerate image with same parameters
export const regenerateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get original generation
    const originalGeneration = await prisma.generation.findUnique({
      where: { id },
      include: { images: true }
    });
    
    if (!originalGeneration) {
      throw new AppError('Generation not found', 404);
    }
    
    if (originalGeneration.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }
    
    // Create new generation request with same parameters
    const regenerateParams = {
      prompt: originalGeneration.prompt,
      negativePrompt: originalGeneration.negativePrompt,
      model: originalGeneration.model,
      style: originalGeneration.style,
      width: originalGeneration.images[0]?.width || 1024,
      height: originalGeneration.images[0]?.height || 1024,
      numOutputs: originalGeneration.batchSize || 1
    };
    
    // Set the request body and call generateImage
    req.body = regenerateParams;
    return await generateImage(req, res, next);
    
  } catch (error) {
    next(error);
  }
};

// Delete generation from history
export const deleteGeneration = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if generation exists and belongs to user
    const generation = await prisma.generation.findUnique({
      where: { id },
      include: { images: true }
    });
    
    if (!generation) {
      throw new AppError('Generation not found', 404);
    }
    
    if (generation.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }
    
    // Delete associated images using StorageProvider
    const storageProvider = getStorageProvider();
    for (const image of generation.images) {
      try {
        // Use cloudPath if available, otherwise extract from URL
        const imagePath = image.cloudPath || image.url;
        await storageProvider.deleteImage(imagePath);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    // Delete generation and associated images from database
    await prisma.generation.delete({
      where: { id }
    });
    
    res.json({
      message: 'Generation deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Pet Portrait Generation with dual images
export const generatePetPortrait = async (req, res, next) => {
  try {
    const {
      userImageUrl,
      styleImageUrl,
      styleName,
      aiModel = 'flux-pro',
      aspectRatio = '1:1',
      width = 1024,
      height = 1024
    } = req.body;

    if (!userImageUrl || !styleImageUrl) {
      throw new AppError('Both user image and style image URLs are required', 400);
    }

    // Check and deduct credits using unified service
    const { user, creditsUsed } = await checkAndDeductCredits(req.user.id, aiModel);

    // Create the pet portrait prompt for AI
    const petPortraitPrompt = `Replace the animal in the style reference image with the pet from the user's photo. Keep all the costume, background, pose, lighting, and artistic style exactly the same. Only change the animal/pet while maintaining the ${styleName} aesthetic and all visual elements like clothing, accessories, setting, and composition.`;

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: req.user.id,
        prompt: petPortraitPrompt,
        model: aiModel,
        style: styleName,
        batchSize: 1,
        status: 'PROCESSING',
        creditsUsed: creditsUsed
      }
    });

    try {
      let imageUrl = null;

      // Call the appropriate AI service based on aiModel
      if (aiModel === 'flux-pro' || aiModel === 'flux-max') {
        // Use working Flux API with dual-image Pet Portrait support
        const FLUX_API_KEY = process.env.FLUX_API_KEY;
        
        if (!FLUX_API_KEY) {
          throw new AppError('Flux API key not configured', 500);
        }

        // Enhanced prompt that includes style reference instruction
        const enhancedPrompt = `${petPortraitPrompt}. Transform the uploaded pet photo to match the artistic style shown in the reference style image. Maintain the pet's features while applying the thematic elements, colors, and artistic style from the reference.`;

        const apiUrl = aiModel === 'flux-max' 
          ? 'https://api.bfl.ai/v1/flux-kontext-max' 
          : 'https://api.bfl.ai/v1/flux-kontext-pro';
        
        const requestBody = {
          prompt: enhancedPrompt,
          input_image: userImageUrl.replace(/^data:image\/[a-z]+;base64,/, ''),
          aspect_ratio: aspectRatio === 'match' ? '1:1' : (aspectRatio || '1:1'),
          output_format: 'jpeg'
        };

        console.log('🎨 Pet Portrait Flux API request:', {
          url: apiUrl,
          prompt: enhancedPrompt.substring(0, 100) + '...',
          style: styleName,
          aspectRatio: requestBody.aspect_ratio
        });

        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'accept': 'application/json',
            'x-key': FLUX_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        console.log('🎨 Flux Pet Portrait API response:', JSON.stringify(response.data, null, 2));

        if (!response.data.id) {
          throw new AppError('No request ID received from Flux API', 500);
        }

        // Poll for result using the same logic as working Flux controller
        const pollResult = await pollForFluxResult(response.data.id, req);
        
        if (pollResult.success) {
          imageUrl = pollResult.image;
        } else {
          throw new AppError(pollResult.error || 'Pet Portrait generation failed', 500);
        }
      } 
      else if (aiModel === 'nano-banana') {
        // Use nano-banana Pet Portrait endpoint with dual-image support
        console.log('🍌 Using nano-banana for Pet Portrait dual-image generation...');
        
        // Prepare request data
        const nanoRequestData = {
          userImageUrl,
          styleImageUrl,
          styleName,
          prompt: petPortraitPrompt,
          aspectRatio
        };
        
        const nanoRequestHeaders = {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        };
        
        // Log detailed request information
        console.log('🍌 Nano-banana request details:', {
          url: 'http://localhost:5000/api/nano-banana/pet-portrait',
          method: 'POST',
          headers: {
            ...nanoRequestHeaders,
            Authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]'
          },
          data: {
            userImageUrl: userImageUrl ? `${userImageUrl.substring(0, 50)}...` : '[MISSING]',
            styleImageUrl: styleImageUrl ? `${styleImageUrl.substring(0, 50)}...` : '[MISSING]',
            styleName: styleName || '[MISSING]',
            prompt: petPortraitPrompt ? `${petPortraitPrompt.substring(0, 100)}...` : '[MISSING]',
            aspectRatio: aspectRatio || '[MISSING]'
          }
        });
        
        try {
          console.log('🍌 Sending nano-banana API request...');
          
          const nanoResponse = await axios.post('http://localhost:5000/api/nano-banana/pet-portrait', nanoRequestData, {
            headers: nanoRequestHeaders,
            timeout: 300000, // 5 minute timeout
            validateStatus: function (status) {
              return status < 600; // Don't throw for any status less than 600
            }
          });
          
          console.log('🍌 Nano-banana response received:', {
            status: nanoResponse.status,
            statusText: nanoResponse.statusText,
            headers: {
              'content-type': nanoResponse.headers['content-type'],
              'content-length': nanoResponse.headers['content-length']
            }
          });
          
          // Log full response data
          console.log('🍌 Full nano-banana response data:', JSON.stringify(nanoResponse.data, null, 2));
          
          // Check response status
          if (nanoResponse.status !== 200) {
            console.error('🍌 Nano-banana API returned non-200 status:', {
              status: nanoResponse.status,
              statusText: nanoResponse.statusText,
              data: nanoResponse.data
            });
            throw new AppError(`Nano-banana API error: ${nanoResponse.status} ${nanoResponse.statusText}`, 500);
          }
          
          // Validate response structure
          if (!nanoResponse.data) {
            console.error('🍌 Nano-banana API returned no data');
            throw new AppError('Nano-banana Pet Portrait generation failed: No response data', 500);
          }
          
          if (nanoResponse.data.success && nanoResponse.data.data && nanoResponse.data.data.image) {
            imageUrl = nanoResponse.data.data.image;
            console.log('🍌 Nano-banana Pet Portrait success!', {
              success: nanoResponse.data.success,
              imageUrl: imageUrl.substring(0, 50) + '...',
              imageType: typeof imageUrl,
              imageLength: imageUrl.length
            });
          } else {
            console.error('🍌 Nano-banana Pet Portrait generation failed - invalid response:', {
              success: nanoResponse.data.success,
              hasImage: !!(nanoResponse.data.data && nanoResponse.data.data.image),
              error: nanoResponse.data.error || 'No error message provided',
              fullResponse: nanoResponse.data
            });
            
            const errorMessage = nanoResponse.data.error || 'Nano-banana Pet Portrait generation failed';
            throw new AppError(errorMessage, 500);
          }
        } catch (error) {
          console.error('🍌 Nano-banana API request failed:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            stack: error.stack
          });
          
          // Re-throw with more specific error message
          if (error.code === 'ECONNREFUSED') {
            throw new AppError('Nano-banana service is not available (connection refused)', 503);
          } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
            throw new AppError('Nano-banana service timed out', 504);
          } else if (error.response) {
            // Server responded with error status
            const errorMsg = error.response.data?.error || error.response.data?.message || error.message;
            throw new AppError(`Nano-banana service error: ${errorMsg}`, error.response.status);
          } else {
            // Network error or other issue
            throw new AppError(`Nano-banana service error: ${error.message}`, 500);
          }
        }
      }
      else {
        throw new AppError(`Pet Portrait generation not yet supported for ${aiModel}. Currently supports: flux-pro, flux-max, nano-banana`, 400);
      }

      if (!imageUrl) {
        throw new AppError('No image generated', 500);
      }

      // Upload and save the generated image
      const storageProvider = getStorageProvider();
      const shouldSaveToGallery = shouldSaveImageForUser(req.user);
      
      let uploadResult = null;
      let thumbnailResult = null;
      let cloudPath = null;
      
      if (shouldSaveToGallery) {
        uploadResult = await storageProvider.uploadImage(imageUrl, 'pet-portrait');
        thumbnailResult = await storageProvider.generateThumbnail(uploadResult.url);
        cloudPath = uploadResult.path;
      }

      // Save to database
      const image = await prisma.image.create({
        data: {
          userId: req.user.id,
          generationId: generation.id,
          url: shouldSaveToGallery ? uploadResult.url : imageUrl,
          thumbnailUrl: shouldSaveToGallery ? thumbnailResult.url : null,
          prompt: petPortraitPrompt,
          model: aiModel,
          style: styleName,
          width: parseInt(width),
          height: parseInt(height),
          isPublic: false,
          cloudPath: cloudPath
        }
      });

      // Update generation status
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      res.json({
        message: 'Pet portrait generated successfully',
        imageUrl: image.url,
        generation: {
          id: generation.id,
          status: 'COMPLETED',
          creditsUsed: creditsUsed
        },
        remainingCredits: user.totalCredits - creditsUsed
      });

    } catch (error) {
      // Update generation status to failed
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });

      // Refund credits on failure
      await refundCredits(req.user.id, creditsUsed, `Pet Portrait generation failed: ${error.message}`);

      console.error('Pet Portrait generation error:', error);
      throw new AppError('Failed to generate pet portrait', 500);
    }

  } catch (error) {
    next(error);
  }
};

// Get generation details by ID
export const getGenerationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const generation = await prisma.generation.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            width: true,
            height: true,
            seed: true,
            steps: true,
            guidance: true
          }
        }
      }
    });
    
    if (!generation) {
      throw new AppError('Generation not found', 404);
    }
    
    if (generation.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }
    
    res.json(generation);
  } catch (error) {
    next(error);
  }
};

/**
 * Poll for generation result from bfl.ai (Flux API)
 * Used for Pet Portrait generation with Flux models
 */
async function pollForFluxResult(requestId, req = null) {
  const FLUX_API_KEY = process.env.FLUX_API_KEY;
  const FLUX_STATUS_URL = 'https://api.bfl.ai/v1/get_result';
  const maxAttempts = 60;
  const baseInterval = 2000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check if request was cancelled
    if (req && req.aborted) {
      throw new Error('Request was cancelled during polling');
    }
    
    try {
      // Use adaptive polling intervals
      const interval = attempt < 5 ? baseInterval : 
                      attempt < 15 ? baseInterval * 1.5 : 
                      baseInterval * 2;
      
      await new Promise(resolve => setTimeout(resolve, interval));
      
      const statusResponse = await axios.get(FLUX_STATUS_URL, {
        params: { id: requestId },
        headers: {
          'accept': 'application/json',
          'x-key': FLUX_API_KEY
        }
      });
      
      console.log(`🎨 Pet Portrait Flux polling attempt ${attempt}: ${statusResponse.data.status}`);
      console.log('Full status response:', JSON.stringify(statusResponse.data, null, 2));
      
      if (statusResponse.data.status === 'Ready') {
        const imageUrl = statusResponse.data.result?.sample;
        
        if (!imageUrl) {
          console.error('No image URL in result:', statusResponse.data);
          throw new Error('No image generated');
        }
        
        console.log('✅ Pet Portrait Flux generation successful, image URL:', imageUrl);
        
        return {
          success: true,
          image: imageUrl,
          thumbnailUrl: imageUrl
        };
      } else if (statusResponse.data.status === 'Error') {
        console.error('❌ Pet Portrait Flux generation failed:', statusResponse.data.error);
        throw new Error(`Generation failed: ${statusResponse.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`Request ${requestId} not found yet, continuing...`);
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Pet Portrait generation timed out after maximum attempts');
}
