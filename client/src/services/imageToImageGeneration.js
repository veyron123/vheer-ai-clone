import { fal } from "@fal-ai/client";
import { getApiUrl } from '../config/api.config';

// Configure API key from environment variable
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY || "e405913f-48b3-42e6-9016-cddd8844add5:20315b83d223a2b6664fe3945238f67d"
});

/**
 * Convert image to base64 if it's a URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Base64 encoded image
 */
async function urlToBase64(imageUrl) {
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
}

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
export async function generateWithFluxImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, model = 'flux-pro') {
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
    
    // Use our backend proxy to avoid CORS issues
    const response = await fetch(getApiUrl('/flux/image-to-image'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: fullNegative,
        input_image: base64Only,
        creative_strength: creativeStrength / 10, // Normalize to 0-1
        control_strength: controlStrength / 5,   // Normalize to 0-1
        model: model
      })
    });
    
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
      // Use our backend proxy for Midjourney API
      const response = await fetch(getApiUrl('/midjourney/image-to-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
 * Generate image-to-image transformation using GPT IMAGE
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} positivePrompt - Positive prompt for generation
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {number} creativeStrength - Creative strength (1-10)
 * @param {number} controlStrength - Control strength (0-5)
 * @param {string} aspectRatio - Aspect ratio for generation
 * @returns {Promise} Generated image data
 */
export async function generateWithGPTImageToImage(imageBase64, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio = '1:1') {
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
    
    // Use our backend proxy for GPT IMAGE API
    const response = await fetch(getApiUrl('/gptimage/image-to-image'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        input_image: base64Only,
        creative_strength: creativeStrength / 10, // Normalize to 0-1
        control_strength: controlStrength / 5,   // Normalize to 0-1
        aspectRatio: aspectRatio
      })
    });
    
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
 * @param {string} aiModel - AI model to use ('flux-pro', 'flux-max', or 'gpt-image')
 * @param {string} aspectRatio - Aspect ratio for generation ('1:1', '16:9', etc.)
 * @returns {Promise} Generated image data
 */
export async function generateImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aiModel = 'flux-pro', aspectRatio = '1:1') {
  // Use Flux for image-to-image generation
  if (aiModel === 'flux-pro' || aiModel === 'flux-max') {
    return await generateWithFluxImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aiModel);
  }
  
  // Use GPT IMAGE for image-to-image generation
  if (aiModel === 'gpt-image') {
    return await generateWithGPTImageToImage(imageUrl, positivePrompt, negativePrompt, creativeStrength, controlStrength, aspectRatio);
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