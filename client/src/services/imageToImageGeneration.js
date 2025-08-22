import { fal } from "@fal-ai/client";
import { getApiUrl } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { urlToBase64 } from '../utils/imageUtils';

// Configure API key from environment variable
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY || "e405913f-48b3-42e6-9016-cddd8844add5:20315b83d223a2b6664fe3945238f67d"
});

// urlToBase64 function removed - now imported from utils/imageUtils.js

/**
 * Generate image-to-image transformation using Flux.1 Kontext
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} model - Flux model to use ('flux-pro' or 'flux-max')
 * @returns {Promise} Generated image data
 */
export async function generateWithFluxImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, model = 'flux-pro', abortSignal = null) {
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
        model: model
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
export async function generateWithQwenImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1', abortSignal = null) {
  try {
    // Upload image to FAL storage first
    let uploadedImageUrl;
    
    if (imageBase64.startsWith('http')) {
      // If it's already a URL, use it directly
      uploadedImageUrl = imageBase64;
    } else {
      // If it's base64, convert to blob and upload to FAL storage
      let base64Data = imageBase64;
      if (!imageBase64.startsWith('data:')) {
        base64Data = await urlToBase64(imageBase64);
      }
      
      // Convert base64 to blob without using fetch (avoids CSP issues)
      // Extract the base64 content and mime type
      const [header, base64Content] = base64Data.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      // Decode base64 to binary
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob from binary data
      const blob = new Blob([bytes], { type: mimeType });
      
      // Create a File object from blob
      const file = new File([blob], 'image.png', { type: mimeType });
      
      // Upload to FAL storage
      console.log('Uploading image to FAL storage for Qwen...');
      uploadedImageUrl = await fal.storage.upload(file);
      console.log('Image uploaded to FAL:', uploadedImageUrl);
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
        input_image: uploadedImageUrl,
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
export async function generateWithGPTImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1', abortSignal = null) {
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
 * @param {string} aiModel - AI model to use ('flux-pro', 'flux-max', 'gpt-image', or 'qwen-image')
 * @param {string} aspectRatio - Aspect ratio for generation ('1:1', '16:9', etc.)
 * @returns {Promise} Generated image data
 */
export async function generateImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aiModel = 'flux-pro', aspectRatio = '1:1', abortSignal = null) {
  // Use Flux for image-to-image generation
  if (aiModel === 'flux-pro' || aiModel === 'flux-max') {
    return await generateWithFluxImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aiModel, abortSignal);
  }
  
  // Use GPT IMAGE for image-to-image generation
  if (aiModel === 'gpt-image') {
    return await generateWithGPTImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio, abortSignal);
  }
  
  // Use Qwen Image for image-to-image generation
  if (aiModel === 'qwen-image') {
    return await generateWithQwenImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio, abortSignal);
  }
  
  // Use Midjourney for image-to-image generation (temporarily disabled)
  if (aiModel === 'midjourney') {
    throw new Error('Midjourney is temporarily disabled for debugging');
    // return await generateWithMidjourneyImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio);
  }
  
  throw new Error(`Unsupported AI model: ${aiModel}`);
}

/**
 * Upload image file to fal.ai storage
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded image
 */
export async function uploadImage(file) {
  try {
    const url = await fal.storage.upload(file);
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}