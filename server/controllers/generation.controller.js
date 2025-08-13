import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
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
      
      // Upload images to Cloudinary and save to database
      const uploadedImages = [];
      
      for (const imageUrl of output) {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: 'vheer-images',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ]
        });
        
        // Create thumbnail
        const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        });
        
        // Save image to database
        const image = await prisma.image.create({
          data: {
            userId: req.user.id,
            generationId: generation.id,
            url: uploadResult.secure_url,
            thumbnailUrl,
            prompt: finalPrompt,
            negativePrompt,
            model,
            style,
            width,
            height,
            seed: seed || null,
            steps: numInferenceSteps,
            guidance: guidanceScale,
            isPublic: false
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
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId: req.user.id },
        include: {
          images: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.generation.count({
        where: { userId: req.user.id }
      })
    ]);
    
    res.json({
      generations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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