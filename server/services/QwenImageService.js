import { fal } from "@fal-ai/client";

class QwenImageService {
  constructor() {
    
    // Configure FAL client with API key
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      throw new Error('FAL_KEY environment variable is required for Qwen Image service');
    }
    
    fal.config({
      credentials: falKey
    });
    
    this.modelName = "fal-ai/qwen-image";
    this.creditCost = 30; // Cost per generation
  }

  /**
   * Generate image using Qwen model (text-to-image)
   */
  async generateImage(prompt, options = {}) {
    try {
      console.log('🎨 Starting Qwen text-to-image generation...');
      console.log('Prompt:', prompt);
      
      const {
        aspectRatio = '1:1',
        negativePrompt = 'blurry, ugly, low quality',
        numInferenceSteps = 30,
        guidanceScale = 4,
        numImages = 1,
        seed,
        outputFormat = 'png',
        acceleration = 'regular',
        enableSafetyChecker = true,
        syncMode = true
      } = options;

      // Convert aspect ratio to image size
      const imageSize = this.getImageSize(aspectRatio);
      console.log(`📐 Aspect ratio conversion: ${aspectRatio} -> ${JSON.stringify(imageSize)}`);
      
      // For custom sizes, use width/height object instead of enum
      let imageSizeParam = imageSize;
      
      // Map enum values to specific dimensions
      const sizeMap = {
        'square_hd': { width: 1024, height: 1024 },
        'square': { width: 512, height: 512 },
        'landscape_16_9': { width: 1920, height: 1080 },
        'portrait_16_9': { width: 1080, height: 1920 },
        'landscape_4_3': { width: 1024, height: 768 },
        'portrait_4_3': { width: 768, height: 1024 }
      };
      
      // Use dimension object if it's a known format
      if (sizeMap[imageSize]) {
        imageSizeParam = sizeMap[imageSize];
        console.log(`📐 Using custom dimensions for ${imageSize}:`, imageSizeParam);
      }
      
      const input = {
        prompt,
        image_size: imageSizeParam,
        negative_prompt: negativePrompt,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: numImages,
        output_format: outputFormat,
        acceleration,
        enable_safety_checker: enableSafetyChecker,
        sync_mode: syncMode
      };

      if (seed) {
        input.seed = parseInt(seed);
      }

      console.log('🔍 Full FAL API Input parameters for text-to-image:');
      console.log(JSON.stringify(input, null, 2));

      const result = await fal.subscribe(this.modelName, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('✅ Qwen generation completed');
      console.log('🔍 FAL API Response:');
      console.log(JSON.stringify(result.data, null, 2));
      
      return this.formatResponse(result.data, prompt, negativePrompt);
      
    } catch (error) {
      console.error('❌ Qwen generation error:', error);
      console.error('Error details:', JSON.stringify(error.body, null, 2));
      throw new Error(`Qwen generation failed: ${error.message}`);
    }
  }

  /**
   * Create a white canvas as base64 image
   */
  async createWhiteCanvas(width, height) {
    // Create a simple white canvas data URL
    const canvas = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
    return canvas;
  }

  /**
   * Edit image using Qwen Image model (image-to-image) 
   * Use the specific image editing model
   */
  async editImage(imageUrl, prompt, options = {}) {
    try {
      console.log('🎨 Starting Qwen image-to-image editing...');
      console.log('Image URL:', imageUrl);
      console.log('Prompt:', prompt);
      
      const {
        aspectRatio = 'match',
        negativePrompt = 'blurry, ugly, low quality',
        numInferenceSteps = 30,
        guidanceScale = 4,
        numImages = 1,
        seed,
        outputFormat = 'png',
        acceleration = 'regular',
        enableSafetyChecker = true,
        syncMode = true
      } = options;

      const input = {
        prompt,
        image_url: imageUrl,
        negative_prompt: negativePrompt,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: numImages,
        output_format: outputFormat,
        acceleration,
        enable_safety_checker: enableSafetyChecker,
        sync_mode: syncMode
      };

      // Only set image_size if not matching input
      if (aspectRatio !== 'match') {
        input.image_size = this.getImageSize(aspectRatio);
      }

      if (seed) {
        input.seed = parseInt(seed);
      }

      console.log('Input parameters:', input);

      // Use the image editing model for this operation
      const editModelName = "fal-ai/qwen-image-edit";
      const result = await fal.subscribe(editModelName, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('✅ Qwen image editing completed');
      
      return this.formatResponse(result.data, prompt, negativePrompt);
      
    } catch (error) {
      console.error('❌ Qwen image editing error:', error);
      console.error('Error details:', JSON.stringify(error.body, null, 2));
      throw new Error(`Qwen image editing failed: ${error.message}`);
    }
  }

  /**
   * Convert aspect ratio to FAL API image size format
   * Based on official FAL AI documentation enum values:
   * square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
   */
  getImageSize(aspectRatio) {
    console.log(`🔍 Converting aspect ratio: "${aspectRatio}"`);
    
    // FAL API predefined formats (as per official docs)
    const sizeMap = {
      '1:1': 'square_hd', // High definition square
      '16:9': 'landscape_16_9', // Landscape 16:9  
      '9:16': 'portrait_16_9', // Portrait 16:9
      '4:3': 'landscape_4_3', // Landscape 4:3
      '3:4': 'portrait_4_3', // Portrait 4:3
      'square': 'square_hd',
      'landscape': 'landscape_4_3', 
      'portrait': 'portrait_4_3',
      'match': 'square_hd' // Default for match in text-to-image
    };

    const result = sizeMap[aspectRatio] || 'square_hd'; // Default to square_hd
    console.log(`🔍 Mapped to FAL format: "${result}"`);
    
    return result;
  }

  /**
   * Format API response to match expected format
   */
  formatResponse(data, prompt, negativePrompt) {
    const image = data.images?.[0];
    
    if (!image?.url) {
      throw new Error('No image generated');
    }

    return {
      images: [{
        url: image.url,
        width: image.width || 1024,
        height: image.height || 1024,
        content_type: image.content_type || 'image/png'
      }],
      prompt: data.prompt || prompt,
      seed: data.seed,
      has_nsfw_concepts: data.has_nsfw_concepts || [false],
      timings: data.timings || {},
      model: 'qwen-image',
      negativePrompt
    };
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      name: 'Qwen Image',
      id: 'qwen-image',
      provider: 'FAL AI',
      creditCost: this.creditCost,
      features: ['text-to-image', 'image-to-image', 'style-transfer'],
      maxResolution: '1344x1344',
      supportedFormats: ['png', 'jpeg'],
      description: 'Advanced image generation and editing model with high-quality results'
    };
  }
}

export { QwenImageService };