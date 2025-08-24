import axios from 'axios';

class GPTImageTextToImageService {
  constructor() {
    this.apiKey = process.env.GPT_IMAGE_API_KEY;
    this.apiUrl = process.env.GPT_IMAGE_API_URL || 'https://api.kie.ai/api/v1/gpt4o-image/generate';
    this.creditCost = 30; // Cost per generation

    if (!this.apiKey) {
      throw new Error('GPT_IMAGE_API_KEY environment variable is required');
    }
  }

  /**
   * Generate image using GPT Image model (text-to-image only)
   */
  async generateImage(prompt, options = {}) {
    try {
      console.log('🎨 Starting GPT Image text-to-image generation...');
      console.log('Prompt:', prompt);
      
      const {
        aspectRatio = '1:1',
        negativePrompt,
        numImages = 1,
        isEnhance = false
      } = options;

      // Convert aspect ratio to GPT Image format
      const size = this.getGPTImageSize(aspectRatio);
      console.log(`📐 Aspect ratio conversion: ${aspectRatio} -> ${size}`);
      
      const requestData = {
        prompt,
        size,
        nVariants: Math.min(Math.max(numImages, 1), 4), // Clamp between 1-4
        isEnhance,
        enableFallback: false // Don't use fallback for consistent results
      };

      console.log('🔍 GPT Image API Request:');
      console.log(JSON.stringify(requestData, null, 2));

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });

      console.log('🔍 GPT Image API Response:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data.code !== 200) {
        throw new Error(response.data.msg || 'GPT Image API error');
      }

      const taskId = response.data.data?.taskId;
      if (!taskId) {
        throw new Error('No task ID received from GPT Image API');
      }

      // Poll for results (GPT Image is async)
      const result = await this.pollForResults(taskId);
      
      console.log('✅ GPT Image generation completed');
      return this.formatResponse(result, prompt, negativePrompt);
      
    } catch (error) {
      console.error('❌ GPT Image generation error:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        throw new Error(`GPT Image API error: ${error.response.data.msg || error.message}`);
      }
      throw new Error(`GPT Image generation failed: ${error.message}`);
    }
  }

  /**
   * Poll for generation results
   */
  async pollForResults(taskId, maxAttempts = 40) {
    console.log(`🔄 Polling for results, taskId: ${taskId}`);
    
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Use the query endpoint as per API documentation
        const queryUrl = `https://api.kie.ai/api/v1/gpt4o-image/query`;
        
        console.log(`📡 Polling attempt ${attempt}/${maxAttempts}`);
        
        const response = await axios.post(queryUrl, {
          taskId: taskId
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        console.log(`📊 Response code: ${response.data?.code}`);
        
        if (response.data && response.data.code === 200) {
          const data = response.data.data;
          console.log('📊 Response data structure:', {
            hasData: !!data,
            hasImages: !!data?.images,
            imageCount: data?.images?.length,
            status: data?.status
          });
          
          // Check for images array with URLs
          if (data && data.images && Array.isArray(data.images) && data.images.length > 0) {
            // Images can be either strings (URLs) or objects with url property
            const hasValidImages = data.images.every(img => 
              typeof img === 'string' || (img && img.url)
            );
            
            if (hasValidImages) {
              console.log('✅ Task completed successfully with images');
              return data;
            }
          }
          
          // Check task status
          if (data && data.status) {
            if (data.status === 'completed' || data.status === 'success') {
              if (data.images && data.images.length > 0) {
                console.log('✅ Task completed with images');
                return data;
              } else {
                console.log('⚠️ Task marked as completed but no images yet, continuing...');
              }
            } else if (data.status === 'failed' || data.status === 'error') {
              throw new Error('GPT Image generation failed: ' + (data.error || data.message || 'Unknown error'));
            } else if (data.status === 'processing' || data.status === 'pending') {
              console.log('⏳ Task still processing...');
            } else {
              console.log(`📝 Task status: ${data.status}`);
            }
          } else {
            console.log('⏳ No status field, continuing to poll...');
          }
        } else if (response.data && response.data.code === 404) {
          console.log('⚠️ Task not found (404), might still be initializing...');
        } else if (response.data && response.data.code === 102) {
          console.log('⏳ Task is processing (code 102)...');
        } else if (response.data) {
          console.log(`⚠️ Unexpected response code: ${response.data.code}, message: ${response.data.msg || 'No message'}`);
        }

        // Check timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > 120000) { // 2 minutes timeout
          throw new Error('Task polling timed out after 2 minutes');
        }

        // Progressive delay: start fast, slow down over time
        const delay = attempt < 10 
          ? 2000  // First 10 attempts: 2 seconds
          : attempt < 20 
            ? 3000  // Next 10 attempts: 3 seconds
            : 5000; // Remaining attempts: 5 seconds
            
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.error(`⚠️ Polling attempt ${attempt} error:`, error.message);
        
        if (error.response) {
          console.error('Error response status:', error.response.status);
          if (error.response.data) {
            console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
          }
        }
        
        // Don't throw on network errors, just continue polling
        if (attempt === maxAttempts) {
          throw new Error(`Polling failed after ${maxAttempts} attempts: ${error.message}`);
        }
        
        // Wait before retry on error
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw new Error('Task polling timed out after maximum attempts');
  }

  /**
   * Convert aspect ratio to GPT Image API format
   * GPT Image supports: '1:1', '3:2', '2:3'
   */
  getGPTImageSize(aspectRatio) {
    console.log(`🔍 Converting aspect ratio: "${aspectRatio}"`);
    
    const sizeMap = {
      '1:1': '1:1',     // Square
      '3:2': '3:2',     // Landscape 
      '2:3': '2:3',     // Portrait
      '16:9': '3:2',    // Map 16:9 to closest supported (3:2)
      '9:16': '2:3',    // Map 9:16 to closest supported (2:3)
      '4:3': '3:2',     // Map 4:3 to closest supported (3:2)
      '3:4': '2:3',     // Map 3:4 to closest supported (2:3)
      'square': '1:1',
      'landscape': '3:2',
      'portrait': '2:3'
    };

    const result = sizeMap[aspectRatio] || '1:1';
    console.log(`🔍 Mapped to GPT Image format: "${result}"`);
    
    return result;
  }

  /**
   * Format API response to match expected format
   */
  formatResponse(data, prompt, negativePrompt) {
    const images = data.images || [];
    
    if (!images.length) {
      throw new Error('No images generated');
    }

    // Convert to expected format
    const formattedImages = images.map(img => ({
      url: img.url || img,
      width: 1024, // GPT Image returns variable sizes
      height: 1024,
      content_type: 'image/png'
    }));

    return {
      images: formattedImages,
      prompt: data.prompt || prompt,
      seed: data.seed || Date.now(),
      has_nsfw_concepts: [false],
      timings: { inference: data.inferenceTime || 0 },
      model: 'gpt-image',
      negativePrompt
    };
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      name: 'GPT Image (Text-to-Image)',
      id: 'gpt-image-text',
      provider: 'KIE AI',
      creditCost: this.creditCost,
      features: ['text-to-image'],
      supportedRatios: ['1:1', '3:2', '2:3'],
      maxVariants: 4,
      description: 'GPT-4o powered image generation from text prompts'
    };
  }
}

export { GPTImageTextToImageService };