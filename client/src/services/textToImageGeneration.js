import { getApiUrl } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { generateWithNanoBanana } from './nanoBananaGeneration';

/**
 * Generate image from text using Qwen Image
 * @param {string} prompt - The text prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {string} style - Style for generation
 * @param {string} aspectRatio - Aspect ratio for generation
 * @param {string} baseImage - Base image for image-to-image generation
 * @returns {Promise} Generated image data
 */
export async function generateWithQwenTextToImage(prompt, negativePrompt = '', style = 'none', aspectRatio = '1:1', abortSignal = null, baseImage = null, advancedSettings = null) {
  try {
    // Get auth token from store
    const token = useAuthStore.getState().token;
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if user is logged in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use provided abort signal or create timeout controller
    let controller = null;
    let timeoutId = null;
    
    if (abortSignal) {
      // Use the provided abort signal
      if (abortSignal.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
    } else {
      // Create timeout controller if no abort signal provided
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
    }
    
    const finalSignal = abortSignal || controller.signal;

    // Prepare request body
    const requestBody = {
      prompt: prompt,
      negativePrompt: negativePrompt || 'blurry, ugly, low quality',
      style: style,
      aspectRatio: aspectRatio
    };

    // Add base image if provided (for image-to-image)
    if (baseImage) {
      requestBody.baseImage = baseImage;
      requestBody.mode = 'image-to-image';
    } else {
      requestBody.mode = 'text-to-image';
    }

    // Add advanced settings if provided
    if (advancedSettings) {
      Object.assign(requestBody, advancedSettings);
    }

    // Use our backend proxy for Qwen Image API
    const response = await fetch(getApiUrl('/qwen/generate'), {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: finalSignal
    }).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    
    if (!response.ok) {
      // Handle cancelled requests
      if (response.status === 499) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.cancelled) {
          throw new DOMException('Request was cancelled', 'AbortError');
        }
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication required');
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.images && result.images.length > 0) {
      return {
        images: result.images.map(img => ({
          url: img.url,
          width: img.width || 1024,
          height: img.height || 1024,
          content_type: img.content_type || 'image/png'
        }))
      };
    }
    
    throw new Error(result.error || 'Failed to generate image');
  } catch (error) {
    console.error("Error generating with Qwen Image:", error);
    throw error;
  }
}

/**
 * Generate image from text using GPT Image
 * @param {string} prompt - The text prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {string} style - Style for generation
 * @param {string} aspectRatio - Aspect ratio for generation
 * @returns {Promise} Generated image data
 */
export async function generateWithGPTTextToImage(prompt, negativePrompt = '', style = 'none', aspectRatio = '1:1', abortSignal = null) {
  try {
    // Get auth token from store
    const token = useAuthStore.getState().token;
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if user is logged in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use provided abort signal or create timeout controller
    let controller = null;
    let timeoutId = null;
    
    if (abortSignal) {
      // Use the provided abort signal
      if (abortSignal.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
    } else {
      // Create timeout controller if no abort signal provided
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
    }
    
    const finalSignal = abortSignal || controller.signal;

    // Use our backend proxy for GPT Image text-to-image API
    const response = await fetch(getApiUrl('/gpt-image-text/generate'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt,
        negativePrompt: negativePrompt || 'blurry, ugly, low quality',
        style: style,
        aspectRatio: aspectRatio
      }),
      signal: finalSignal
    }).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    
    if (!response.ok) {
      // Handle cancelled requests
      if (response.status === 499) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.cancelled) {
          throw new DOMException('Request was cancelled', 'AbortError');
        }
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication required');
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.images && result.images.length > 0) {
      return {
        images: result.images.map(img => ({
          url: img.url,
          width: img.width || 1024,
          height: img.height || 1024,
          content_type: img.content_type || 'image/png'
        }))
      };
    }
    
    throw new Error(result.error || 'Failed to generate image');
  } catch (error) {
    console.error("Error generating with GPT Image:", error);
    throw error;
  }
}

/**
 * Main function to generate image from text
 * @param {string} prompt - The text prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {string} style - Style for generation
 * @param {string} aiModel - AI model to use ('gpt-image', 'qwen-image', or 'nano-banana')
 * @param {string} aspectRatio - Aspect ratio for generation
 * @param {string} baseImage - Base image for image-to-image generation
 * @returns {Promise} Generated image data
 */
export async function generateTextToImage(prompt, negativePrompt = '', style = 'none', aiModel = 'qwen-image', aspectRatio = '1:1', abortSignal = null, baseImage = null, advancedSettings = null) {
  // Use Nano-Banana for text-to-image generation
  if (aiModel === 'nano-banana') {
    const result = await generateWithNanoBanana(prompt, style, aspectRatio, abortSignal);
    return {
      images: [{
        url: result.url,
        width: 1024,
        height: 1024,
        content_type: 'image/png'
      }]
    };
  }
  
  // Use Qwen Image for text-to-image generation
  if (aiModel === 'qwen-image') {
    return await generateWithQwenTextToImage(prompt, negativePrompt, style, aspectRatio, abortSignal, baseImage, advancedSettings);
  }
  
  // Use GPT Image for text-to-image generation
  if (aiModel === 'gpt-image') {
    return await generateWithGPTTextToImage(prompt, negativePrompt, style, aspectRatio, abortSignal);
  }
  
  throw new Error(`Unsupported AI model: ${aiModel}`);
}