import { getApiUrl } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { urlToBase64, fileToBase64 } from '../utils/imageUtils';
import { generateWithNanoBananaImageToImage } from './nanoBananaGeneration';

// urlToBase64 function removed - now imported from utils/imageUtils.js

/**
 * Generate image-to-image transformation using Flux.1 Kontext
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} model - Flux model to use ('flux-pro')
 * @returns {Promise} Generated image data
 */
export async function generateWithFluxImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, model = 'flux-pro', abortSignal = null, scale = 3.5) {
  try {
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Combine prompts for the transformation
    const fullPrompt = positivePrompt || "Transform this image with high quality, detailed, professional";
    const fullNegative = negativePrompt || "blurry, low quality, distorted, ugly";
    
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

    // Use our backend proxy to avoid CORS issues
    const response = await fetch(getApiUrl('/flux/image-to-image'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: fullNegative,
        input_image: base64Only,
        creative_strength: creativeStrength / 10, // Normalize to 0-1
        control_strength: controlStrength / 5,   // Normalize to 0-1
        model: model,
        scale: scale
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
    
    if (result.success && result.image) {
      return {
        images: [{
          url: result.image,
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      };
    }
    
    throw new Error(result.error || 'Failed to generate image');
  } catch (error) {
    console.error('Error generating with Flux:', error);
    throw error;
  }
}

/**
 * Generate image-to-image transformation using Midjourney
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} aspectRatio - Aspect ratio for generation
 * @returns {Promise} Generated image data
 */
export async function generateWithMidjourneyImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1') {
  try {
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Construct the prompt for Midjourney
    const fullPrompt = positivePrompt || "Transform this image with high quality, detailed, professional";
    
    // Create AbortController for timeout (Midjourney can take 5+ minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 minute timeout

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
      
      // Use our backend proxy for Midjourney API
      const response = await fetch(getApiUrl('/midjourney/image-to-image'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          input_image: base64Only,
          creative_strength: creativeStrength / 10, // Normalize to 0-1
          control_strength: controlStrength / 5,   // Normalize to 0-1
          aspectRatio: aspectRatio
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.image) {
        return {
          images: [{
            url: result.image,
            width: 1024,
            height: 1024,
            content_type: 'image/png'
          }]
        };
      }
      
      throw new Error(result.error || 'Failed to generate image');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Midjourney generation timeout - please try again (generation can take up to 6 minutes)');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error generating with Midjourney:", error);
    throw error;
  }
}

/**
 * Generate image-to-image transformation using Qwen Image
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} aspectRatio - Aspect ratio for generation
 * @returns {Promise} Generated image data
 */
export async function generateWithQwenImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1', abortSignal = null, scale = 3.5) {
  try {
    // Prepare image payload for backend (supports URL or base64)
    let processedImage = imageBase64;
    
    if (!imageBase64.startsWith('http')) {
      processedImage = imageBase64.startsWith('data:')
        ? imageBase64
        : await urlToBase64(imageBase64);
    }
    
    // Construct the prompt for Qwen Image
    const fullPrompt = positivePrompt || "Transform this image with high quality, detailed, professional";
    
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

    // Use our backend proxy for Qwen Image API with the uploaded URL
    const response = await fetch(getApiUrl('/qwen/edit'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        input_image: processedImage,
        aspectRatio: aspectRatio,
        scale: scale
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
    console.error("Error generating with Qwen Image:", error);
    throw error;
  }
}

/**
 * Generate image-to-image transformation using GPT IMAGE
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} aspectRatio - Aspect ratio for generation
 * @returns {Promise} Generated image data
 */
export async function generateWithGPTImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1', abortSignal = null, scale = 3.5) {
  try {
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Construct the prompt for GPT IMAGE
    const fullPrompt = positivePrompt || "Transform this image with high quality, detailed, professional";
    
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

    // Use our backend proxy for GPT IMAGE API
    const response = await fetch(getApiUrl('/gptimage/image-to-image'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        input_image: base64Only,
        creative_strength: creativeStrength / 10, // Normalize to 0-1
        control_strength: controlStrength / 5,   // Normalize to 0-1
        aspectRatio: aspectRatio,
        scale: scale
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
    
    if (result.success && result.image) {
      return {
        images: [{
          url: result.image,
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      };
    }
    
    throw new Error(result.error || 'Failed to generate image');
  } catch (error) {
    console.error("Error generating with GPT IMAGE:", error);
    throw error;
  }
}

/**
 * Main function to generate image-to-image transformation
 * @param {string} imageUrl - URL or base64 of the uploaded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} aiModel - AI model to use ('qwen-image', 'nano-banana', or legacy options)
 * @param {string} aspectRatio - Aspect ratio for generation ('1:1', '16:9', etc.)
 * @param {AbortSignal|null} abortSignal - AbortController signal to cancel requests
 * @param {number} scale - Guidance scale for generation quality (default: 3.5)
 * @returns {Promise} Generated image data
 */
export async function generateImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aiModel = 'qwen-image', aspectRatio = '1:1', abortSignal = null, scale = 3.5) {
  
  // Use GPT IMAGE for image-to-image generation (removed)
  if (aiModel === 'gpt-image') {
    throw new Error('GPT Image model is no longer supported');
  }
  
  // Use Qwen Image for image-to-image generation
  if (aiModel === 'qwen-image') {
    return await generateWithQwenImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio, abortSignal, scale);
  }
  
  // Use Nano-Banana for image-to-image generation
  if (aiModel === 'nano-banana') {
    try {
      // Format prompt for Nano-Banana to ensure transformation
      const transformPrompt = positivePrompt ? 
        `Transform this photo: ${positivePrompt}` : 
        'Transform this photo with creative style and artistic enhancement';
      
      const result = await generateWithNanoBananaImageToImage(imageUrl, transformPrompt, 'none', aspectRatio, abortSignal);
      return {
        images: [{
          url: result.url,
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      };
    } catch (error) {
      console.error('Nano-Banana generation failed:', error);
      throw error; // Re-throw to be handled by caller
    }
  }
  
  // Use Midjourney for image-to-image generation (temporarily disabled)
  if (aiModel === 'midjourney') {
    throw new Error('Midjourney is temporarily disabled for debugging');
    // return await generateWithMidjourneyImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio);
  }
  
  throw new Error(`Unsupported AI model: ${aiModel}`);
}

/**
 * Convert uploaded image file to base64 string
 * @param {File} file - Image file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export async function uploadImage(file) {
  try {
    return await fileToBase64(file);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}
