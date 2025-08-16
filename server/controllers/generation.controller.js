import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { getStorageProvider } from '../utils/storageProvider.js';
import { shouldSaveImageForUser } from '../utils/imageStorage.js';
import { AppError } from '../middleware/error.middleware.js';

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