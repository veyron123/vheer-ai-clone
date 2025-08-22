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
        acceleration = 'regular'
      } = options;

      // Convert aspect ratio to image size
      const imageSize = this.getImageSize(aspectRatio);
      
      const input = {
        prompt,
        image_size: imageSize,
        negative_prompt: negativePrompt,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: numImages,
        output_format: outputFormat,
        acceleration,
        enable_safety_checker: true,
        sync_mode: true
      };

      if (seed) {
        input.seed = parseInt(seed);
      }

      console.log('Input parameters:', input);

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
        acceleration = 'regular'
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
        enable_safety_checker: true,
        sync_mode: true
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
   * Convert aspect ratio to image size object
   */
  getImageSize(aspectRatio) {
    const sizeMap = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1152, height: 896 },
      '3:4': { width: 896, height: 1152 },
      'square': { width: 1024, height: 1024 },
      'landscape': { width: 1344, height: 768 },
      'portrait': { width: 768, height: 1344 }
    };

    return sizeMap[aspectRatio] || sizeMap['1:1'];
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