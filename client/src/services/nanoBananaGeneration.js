import { getApiUrl } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { urlToBase64 } from '../utils/imageUtils';

/**
 * Generate text-to-image with Nano-Banana (Gemini 2.5 Flash)
 * @param {string} prompt - Text prompt for generation
 * @param {string} style - Style to apply
 * @param {string} aspectRatio - Aspect ratio for the image
 * @param {AbortSignal} abortSignal - Abort signal for cancelling request
 * @returns {Promise} Generated image data
 */
export async function generateWithNanoBanana(prompt, style = 'none', aspectRatio = '1:1', abortSignal = null) {
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

    // Make API request
    const response = await fetch(getApiUrl('/nano-banana/generate'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        style,
        aspectRatio
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
      
      // Handle insufficient credits
      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Insufficient credits');
      }
      
      // Handle API quota exceeded
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API quota exceeded. Please try again later.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Failed to generate image' }));
      throw new Error(error.error || 'Failed to generate image');
    }
    
    const result = await response.json();
    
    console.log('🔍 Nano-Banana Text-to-Image API Response:', {
      success: result.success,
      hasImage: !!result.image,
      image: result.image?.substring(0, 50) + '...',
      credits: result.credits,
      fullResult: result
    });
    
    if (result.success && result.image) {
      const returnData = {
        success: true,
        url: result.image,
        model: 'nano-banana',
        creditsUsed: result.credits?.used || 20
      };
      
      console.log('✅ Nano-Banana Text-to-Image returning:', returnData);
      return returnData;
    }
    
    console.error('❌ Nano-Banana Text-to-Image unexpected response format:', result);
    throw new Error('Unexpected response format');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Nano-Banana generation was cancelled');
      throw error;
    }
    
    console.error('Nano-Banana generation error:', error);
    throw error;
  }
}

/**
 * Generate image-to-image transformation with Nano-Banana
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} prompt - Text prompt for generation
 * @param {string} style - Style to apply  
 * @param {string} aspectRatio - Aspect ratio for the image
 * @param {AbortSignal} abortSignal - Abort signal for cancelling request
 * @returns {Promise} Generated image data
 */
export async function generateWithNanoBananaImageToImage(imageBase64, prompt, style = 'none', aspectRatio = '1:1', abortSignal = null) {
  try {
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
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

    // Make API request
    const response = await fetch(getApiUrl('/nano-banana/image-to-image'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        input_image: base64Only,
        style,
        aspectRatio
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
      
      // Handle insufficient credits
      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Insufficient credits');
      }
      
      // Handle API quota exceeded
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API quota exceeded. Please try again later.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Failed to generate image' }));
      throw new Error(error.error || 'Failed to generate image');
    }
    
    const result = await response.json();
    
    console.log('🔍 Nano-Banana Image-to-Image API Response:', {
      success: result.success,
      hasImage: !!result.image,
      image: result.image?.substring(0, 50) + '...',
      credits: result.credits,
      fullResult: result
    });
    
    if (result.success && result.image) {
      const returnData = {
        success: true,
        url: result.image,
        model: 'nano-banana',
        creditsUsed: result.credits?.used || 20
      };
      
      console.log('✅ Nano-Banana Image-to-Image returning:', returnData);
      return returnData;
    }
    
    console.error('❌ Nano-Banana Image-to-Image unexpected response format:', result);
    throw new Error('Unexpected response format');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Nano-Banana generation was cancelled');
      throw error;
    }
    
    console.error('Nano-Banana image-to-image error:', error);
    throw error;
  }
}