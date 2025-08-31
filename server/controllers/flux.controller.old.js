import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { getModelCredits, canAffordGeneration } from '../config/pricing.config.js';
import { saveGeneratedImage } from './images.controller.js';

const prisma = new PrismaClient();

const FLUX_API_KEY = process.env.FLUX_API_KEY;
const FLUX_API_URL = process.env.FLUX_API_URL || 'https://api.bfl.ai/v1/flux-kontext-pro';

// Current bfl.ai endpoints (ACTIVE)
const FLUX_KONTEXT_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';
const FLUX_STATUS_URL = 'https://api.bfl.ai/v1/get_result';

/* =====================================================
 * KIE.AI API LEGACY ENDPOINTS - COMMENTED FOR FUTURE USE
 * =====================================================
 * 
 * Previous kie.ai API endpoints (LEGACY - COMMENTED):
 * 
 * const FLUX_KONTEXT_API_URL_KIE = 'https://api.kie.ai/api/v1/flux/kontext/generate';
 * const FLUX_STATUS_URL_KIE = 'https://api.kie.ai/api/v1/flux/kontext/status';
 * 
 * Key differences:
 * - kie.ai used /kontext/generate for both Pro and Max
 * - Status checking via /kontext/status endpoint
 * - Required Bearer token authentication
 * - Different request/response structure
 * 
 * To revert to kie.ai, update .env:
 * FLUX_API_URL="https://api.kie.ai/api/v1/flux/kontext/generate"
 * ===================================================== */

// Flux API configured

// Generate image with Flux
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, model, aspectRatio } = req.body;
    const userId = req.user?.id;
    
    // Check if request was aborted
    if (req.aborted) {
      console.log('Request was aborted before processing');
      return res.status(499).json({ error: 'Request cancelled' });
    }

    // Processing Flux generation request

    // Require authentication for image generation
    if (!userId) {
      // User not authenticated - generation requires login
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to generate images'
      });
    }

    // Check credits before processing
    const modelId = model || 'flux-pro';
    const requiredCredits = getModelCredits(modelId);
    
    try {
      // Get user from database directly instead of making HTTP call
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalCredits: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const creditCheckResponse = {
        data: {
          canAfford: user.totalCredits >= requiredCredits,
          available: user.totalCredits
        }
      };

      console.log('Credit check response:', creditCheckResponse.data);
      if (!creditCheckResponse.data.canAfford) {
        console.log('Insufficient credits - returning 400');
        return res.status(400).json({ 
          error: 'Insufficient credits',
          required: requiredCredits,
          available: creditCheckResponse.data.available,
          modelId
        });
      }
    } catch (creditError) {
      console.error('Credit check failed:', creditError.message);
      return res.status(500).json({
        error: 'Credit verification failed',
        message: 'Unable to verify account credits'
      });
    }

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // Determine steps based on model selection
    // Flux Pro: 28 steps (faster, good quality)
    // Flux Max: 50 steps (maximum quality, slower generation)
    const steps = model === 'flux-max' ? 50 : 28;
    console.log(`Using ${model || 'flux-pro'} model with ${steps} steps`);

    // Make request to Flux API at bfl.ai (CURRENT ACTIVE FORMAT)
    const requestBody = {
      prompt: prompt,
      input_image: input_image.replace(/^data:image\/[a-z]+;base64,/, ''), // Clean base64
      aspect_ratio: aspectRatio === 'match' ? '1:1' : (aspectRatio || '1:1'),  // Handle 'match' case by defaulting to 1:1
      output_format: 'jpeg'
    };
    
    /* =====================================================
     * KIE.AI API LEGACY REQUEST FORMAT - COMMENTED
     * =====================================================
     * 
     * Previous kie.ai request format (LEGACY - COMMENTED):
     * 
     * const requestBodyKie = {
     *   prompt: prompt,
     *   inputImage: input_image, // Note: 'inputImage' instead of 'input_image'
     *   model: model === 'flux-max' ? 'flux-kontext-max' : 'flux-kontext-pro',
     *   aspectRatio: aspectRatio || '1:1', // Note: camelCase 'aspectRatio'
     *   enableTranslation: true,
     *   outputFormat: 'jpeg' // Note: camelCase 'outputFormat'
     * };
     * 
     * Headers for kie.ai:
     * {
     *   'Authorization': `Bearer ${FLUX_API_KEY}`,
     *   'Content-Type': 'application/json'
     * }
     * ===================================================== */
    
    console.log('Flux API request to bfl.ai:', {
      prompt: requestBody.prompt,
      aspect_ratio: requestBody.aspect_ratio,
      output_format: requestBody.output_format,
      has_input_image: !!requestBody.input_image
    });
    
    // Determine the correct endpoint based on model
    const apiUrl = model === 'flux-max' ? 'https://api.bfl.ai/v1/flux-kontext-max' : 'https://api.bfl.ai/v1/flux-kontext-pro';
    
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flux API response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.id) {
      // Start polling for result using the new bfl.ai format
      const result = await pollForBflResult(response.data.id, response.data.polling_url, req);
      
      // If generation was successful and user is authenticated, deduct credits and save image
      if (result.success && userId) {
        const modelId = model || 'flux-pro';
        const requiredCredits = getModelCredits(modelId);
        
        try {
          // Deduct credits directly from database
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalCredits: {
                decrement: requiredCredits
              }
            }
          });
          console.log(`Successfully deducted ${requiredCredits} credits for ${modelId}`);
          
          // Get user data with subscription info for image saving
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
          });
          
          if (user) {
            // Create generation record
            const generation = await prisma.generation.create({
              data: {
                userId: userId,
                prompt: prompt,
                negativePrompt: '',
                model: modelId,
                style: style,
                status: 'COMPLETED',
                creditsUsed: requiredCredits,
                completedAt: new Date()
              }
            });
            
            // Try to save the generated image for eligible users
            try {
              await saveGeneratedImage(
                { url: result.image, width: 1024, height: 1024 },
                user,
                generation
              );
              console.log('Image saved to user gallery');
            } catch (saveError) {
              console.log('Image not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else {
      throw new Error('No request ID received from bfl.ai API');
    }
  } catch (error) {
    console.error('Flux generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Check if the error is due to request cancellation
    if (error.message.includes('Request was cancelled') || req.aborted) {
      return res.status(499).json({ 
        error: 'Request cancelled',
        cancelled: true
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};

// Poll for generation result from bfl.ai (new API format)
async function pollForBflResult(requestId, pollingUrl, req = null) {
  const maxAttempts = 60; // Reduce attempts but increase interval
  const baseInterval = 2000; // 2 seconds base interval
  
  console.log(`Starting to poll bfl.ai for request: ${requestId}`);
  console.log(`Polling URL: ${pollingUrl || 'https://api.bfl.ai/v1/get_result?id=' + requestId}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    // Check if request was aborted
    if (req && req.aborted) {
      console.log(`Polling cancelled for request: ${requestId}`);
      throw new Error('Request was cancelled');
    }
    
    try {
      let response;
      
      // Use polling_url if provided
      if (pollingUrl) {
        console.log(`🔗 Using polling URL: ${pollingUrl}`);
        response = await axios.get(pollingUrl, {
          headers: {
            'accept': 'application/json',
            'x-key': FLUX_API_KEY
          }
        });
      } else {
        // Fallback to standard method
        console.log(`🔗 Using fallback URL: https://api.bfl.ai/v1/get_result?id=${requestId}`);
        response = await axios.get(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
          headers: {
            'accept': 'application/json',
            'x-key': FLUX_API_KEY
          }
        });
      }
      
      console.log(`Poll attempt ${i + 1}, status:`, response.data?.status);
      
      if (response.data.status === 'Ready' && response.data.result) {
        console.log('bfl.ai generation completed successfully!');
        return {
          success: true,
          image: response.data.result.sample
        };
      } else if (response.data.status === 'Error' || response.data.status === 'Failed') {
        throw new Error(`Generation failed: ${response.data.error || 'Unknown error'}`);
      }
      // Status: 'Pending' or 'Request Moderated' means still processing
      
      // Wait before next poll with progressive backoff
      const waitTime = Math.min(baseInterval * Math.pow(1.2, i), 10000); // Max 10 seconds
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } catch (error) {
      console.error('bfl.ai polling error:', error.message);
      
      // Check if it's a 500 error and we still have attempts left
      if (error.response?.status === 500 && i < maxAttempts - 1) {
        console.log(`Retrying due to server error (${i + 1}/${maxAttempts})`);
        // Wait longer on server errors with exponential backoff
        const retryWait = Math.min(baseInterval * Math.pow(2, i + 1), 30000); // Max 30 seconds
        await new Promise(resolve => setTimeout(resolve, retryWait));
        continue;
      }
      
      // Check if it's the last attempt
      if (i === maxAttempts - 1) {
        console.error('Flux generation error:', error.response?.data || error.message);
        console.error('Full error:', error);
        
        // If it's 500 errors consistently, provide a more user-friendly message
        if (error.response?.status === 500) {
          throw new Error('The Flux AI service is temporarily unavailable due to server maintenance. Please try again later or use a different AI model.');
        }
        
        throw new Error(`BFL API error after ${maxAttempts} attempts: ${error.response?.data?.error || error.message}`);
      }
      
      // Wait before retry for non-500 errors
      const retryWait = Math.min(baseInterval * Math.pow(1.5, i), 15000); // Max 15 seconds
      await new Promise(resolve => setTimeout(resolve, retryWait));
    }
  }
  
  throw new Error('bfl.ai generation timeout');
}

/* =====================================================
 * KIE.AI API LEGACY CODE - COMMENTED FOR FUTURE USE
 * =====================================================
 * 
 * This code was used for the previous kie.ai API integration.
 * Kept for potential future reconnection to kie.ai services.
 * 
 * Key differences from bfl.ai:
 * - Uses 'taskId' instead of 'id'
 * - Different response structure with successFlag (0,1,2,3)
 * - Bearer token authentication instead of x-key
 * - Different polling intervals and timeout settings
 * - Legacy endpoint: https://api.kie.ai/api/v1/flux/kontext/generate
 * 
 * To revert to kie.ai:
 * 1. Uncomment this function
 * 2. Update FLUX_API_URL in .env to kie.ai endpoint
 * 3. Change authentication headers to Bearer
 * 4. Update request body format in generateImage function
 * ===================================================== */

// Poll for Flux Kontext result at kie.ai (LEGACY - COMMENTED)
// async function pollForFluxKontextResult(taskId, req = null) {
//   const maxAttempts = 100; // 5 minutes timeout  
//   const pollInterval = 3000; // 3 seconds between polls
//   
//   console.log(`Starting to poll Flux Kontext for task: ${taskId}`);
//   
//   for (let i = 0; i < maxAttempts; i++) {
//     // Check if request was aborted
//     if (req && req.aborted) {
//       console.log(`Polling cancelled for task: ${taskId}`);
//       throw new Error('Request was cancelled');
//     }
//     
//     try {
//       const response = await axios.get(`${FLUX_STATUS_URL}?taskId=${taskId}`, {
//         headers: {
//           'Authorization': `Bearer ${FLUX_API_KEY}`
//         }
//       });
//       
//       console.log(`Poll attempt ${i + 1}, status:`, response.data?.data?.successFlag);
//       
//       if (response.data && response.data.code === 200 && response.data.data) {
//         const taskData = response.data.data;
//         
//         // Check success flag: 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
//         if (taskData.successFlag === 1 && taskData.response) {
//           console.log('Flux Kontext generation completed successfully!');
//           return {
//             success: true,
//             image: taskData.response.resultImageUrl || taskData.response.originImageUrl
//           };
//         } else if (taskData.successFlag === 2 || taskData.successFlag === 3) {
//           throw new Error(`Generation failed: ${taskData.errorMessage || 'Unknown error'}`);
//         }
//         // successFlag === 0 means still generating, continue polling
//       }
//       
//       await new Promise(resolve => setTimeout(resolve, pollInterval));
//     } catch (error) {
//       console.error('Polling error:', error.message);
//       if (i === maxAttempts - 1) throw error;
//     }
//   }
//   
//   throw new Error('Flux Kontext generation timeout');
// }

// Poll for generation result (legacy function for compatibility)
async function pollForResult(requestId) {
  // This is now just a wrapper for backward compatibility
  return pollForFluxKontextResult(requestId);
}

// Original polling function (not used anymore)
async function pollForResultOld(requestId) {

  const maxAttempts = 60; // 30 seconds timeout
  const pollInterval = 500; // 500ms between polls
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
        headers: {
          'accept': 'application/json',
          'x-key': FLUX_API_KEY
        }
      });
      
      if (response.data.status === 'Ready' && response.data.result) {
        return {
          success: true,
          image: response.data.result.sample
        };
      } else if (response.data.status === 'Error' || response.data.status === 'Failed') {
        throw new Error(`Generation failed: ${response.data.error || 'Unknown error'}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Polling error:', error);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Generation timeout');
}

// Generate image-to-image with Flux.1 Kontext (Pro/Max)
export const generateImageToImage = async (req, res) => {
  try {
    const { 
      prompt, 
      negative_prompt, 
      input_image, 
      creative_strength = 0.5, 
      control_strength = 0.4,
      model = 'flux-pro', // 'flux-pro' = Kontext Pro, 'flux-max' = Kontext Max
      aspectRatio
    } = req.body;
    const userId = req.user?.id;

    console.log('Flux Kontext image-to-image request:', { 
      model, 
      hasPrompt: !!prompt, 
      hasNegative: !!negative_prompt,
      hasImage: !!input_image,
      creative_strength,
      control_strength,
      userId
    });

    // Require authentication for image generation
    if (!userId) {
      // User not authenticated - generation requires login
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to generate images'
      });
    }

    // Check credits before processing
    const modelId = model || 'flux-pro';
    const requiredCredits = getModelCredits(modelId);
    
    try {
      // Get user from database directly instead of making HTTP call
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalCredits: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const creditCheckResponse = {
        data: {
          canAfford: user.totalCredits >= requiredCredits,
          available: user.totalCredits
        }
      };

      console.log('Credit check response:', creditCheckResponse.data);
      if (!creditCheckResponse.data.canAfford) {
        console.log('Insufficient credits - returning 400');
        return res.status(400).json({ 
          error: 'Insufficient credits',
          required: requiredCredits,
          available: creditCheckResponse.data.available,
          modelId
        });
      }
    } catch (creditError) {
      console.error('Credit check failed:', creditError.message);
      return res.status(500).json({
        error: 'Credit verification failed',
        message: 'Unable to verify account credits'
      });
    }

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // Determine the correct endpoint based on model
    const apiUrl = model === 'flux-max' ? 'https://api.bfl.ai/v1/flux-kontext-max' : 'https://api.bfl.ai/v1/flux-kontext-pro';
    console.log(`Using ${model === 'flux-max' ? 'Flux.1 Kontext Max' : 'Flux.1 Kontext Pro'}`);
    console.log('API URL:', apiUrl);

    // Create editing prompt (Kontext specializes in image editing with simple prompts)
    let fullPrompt = prompt;
    if (negative_prompt) {
      // For Kontext, we integrate negative prompts more naturally
      fullPrompt = `${prompt}. Make sure to avoid: ${negative_prompt}`;
    }

    console.log('Kontext editing prompt:', fullPrompt);
    console.log('Input image length:', input_image?.length);

    // Make request to bfl.ai API (CURRENT ACTIVE FORMAT)
    const requestBody = {
      prompt: fullPrompt,
      input_image: input_image.replace(/^data:image\/[a-z]+;base64,/, ''), // Clean base64
      aspect_ratio: aspectRatio === 'match' ? '1:1' : (aspectRatio || '1:1'),  // Handle 'match' case by defaulting to 1:1
      output_format: 'jpeg'
    };

    /* =====================================================
     * KIE.AI API LEGACY REQUEST FORMAT FOR IMAGE-TO-IMAGE
     * =====================================================
     * 
     * Previous kie.ai request format for image-to-image (LEGACY):
     * 
     * const requestBodyKie = {
     *   prompt: fullPrompt,
     *   inputImage: input_image, // Note: 'inputImage' instead of 'input_image'
     *   model: model === 'flux-max' ? 'flux-kontext-max' : 'flux-kontext-pro',
     *   aspectRatio: aspectRatio || '1:1', // Note: camelCase
     *   enableTranslation: true,
     *   outputFormat: 'jpeg' // Note: camelCase
     * };
     * 
     * Single endpoint for kie.ai: FLUX_KONTEXT_API_URL_KIE
     * Headers: { 'Authorization': `Bearer ${FLUX_API_KEY}` }
     * ===================================================== */

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('bfl.ai API response status:', response.status);
    console.log('bfl.ai API response data:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.id) {
      // Use id from response (new bfl.ai format)
      const requestId = response.data.id;
      console.log(`📋 Request created with ID: ${requestId}`);
      
      // Start polling for result using the new bfl.ai format
      const result = await pollForBflResult(requestId, response.data.polling_url, req);
      
      // If generation was successful and user is authenticated, deduct credits and save image
      if (result.success && userId) {
        const modelId = model || 'flux-pro';
        const requiredCredits = getModelCredits(modelId);
        
        try {
          // Deduct credits directly from database
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalCredits: {
                decrement: requiredCredits
              }
            }
          });
          console.log(`Successfully deducted ${requiredCredits} credits for ${modelId}`);
          
          // Get user data with subscription info for image saving
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
          });
          
          if (user) {
            // Create generation record
            const generation = await prisma.generation.create({
              data: {
                userId: userId,
                prompt: prompt,
                negativePrompt: '',
                model: modelId,
                style: style,
                status: 'COMPLETED',
                creditsUsed: requiredCredits,
                completedAt: new Date()
              }
            });
            
            // Try to save the generated image for eligible users
            try {
              await saveGeneratedImage(
                { url: result.image, width: 1024, height: 1024 },
                user,
                generation
              );
              console.log('Image saved to user gallery');
            } catch (saveError) {
              console.log('Image not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else {
      throw new Error('No request ID received from bfl.ai API');
    }
  } catch (error) {
    console.error('Flux image-to-image generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Check if the error is due to request cancellation
    if (error.message.includes('Request was cancelled') || req.aborted) {
      return res.status(499).json({ 
        error: 'Request cancelled',
        cancelled: true
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};