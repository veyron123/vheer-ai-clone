import axios from 'axios';
import { getModelCredits, canAffordGeneration } from '../config/pricing.config.js';

const FLUX_API_KEY = process.env.FLUX_API_KEY || '2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0';
const FLUX_API_URL = process.env.FLUX_API_URL || 'https://api.bfl.ai/v1/flux-kontext-pro';

// Flux.1 Kontext models for image editing (image-to-image)
const FLUX_KONTEXT_PRO_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';
const FLUX_KONTEXT_MAX_URL = 'https://api.bfl.ai/v1/flux-kontext-max';

console.log('Flux API configuration:', {
  FLUX_API_KEY: FLUX_API_KEY ? 'Set' : 'Not set',
  FLUX_API_URL,
  NODE_ENV: process.env.NODE_ENV
});

// Generate image with Flux
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, model } = req.body;
    const userId = req.user?.id;

    console.log('Flux generation request:', { style, model, hasPrompt: !!prompt, hasImage: !!input_image, userId });

    // Skip credit checks for testing if user not authenticated
    if (userId) {
      // Check credits before processing (only if authenticated)
      const modelId = model || 'flux-pro';
      const requiredCredits = getModelCredits(modelId);
      
      try {
        // Make API call to check user credits
        const creditCheckResponse = await axios.post('http://localhost:5000/api/users/check-credits', {
          modelId
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });

        if (!creditCheckResponse.data.canAfford) {
          return res.status(400).json({ 
            error: 'Insufficient credits',
            required: requiredCredits,
            available: creditCheckResponse.data.available,
            modelId
          });
        }
      } catch (creditError) {
        console.log('Credit check failed, proceeding with generation for testing:', creditError.message);
      }
    } else {
      console.log('User not authenticated, skipping credit checks for testing');
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

    // Make request to Flux API (simplified parameters)
    const response = await axios.post(FLUX_API_URL, {
      prompt,
      input_image
    }, {
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.id) {
      // Start polling for result
      const result = await pollForResult(response.data.id);
      
      // If generation was successful, deduct credits
      if (result.success) {
        try {
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
            }
          });
          console.log(`Successfully deducted ${requiredCredits} credits for ${modelId}`);
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else {
      throw new Error('No request ID received from Flux API');
    }
  } catch (error) {
    console.error('Flux generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};

// Poll for generation result from Flux.1 Kontext
async function pollForKontextResult(requestId, pollingUrl) {
  const maxAttempts = 120; // 60 seconds timeout (longer for Kontext)
  const pollInterval = 500; // 500ms between polls
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      let response;
      
      // Use polling_url if provided (like anime-generator does)
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
      console.error('Kontext polling error:', error.message);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Kontext generation timeout');
}

// Poll for generation result (legacy function for compatibility)
async function pollForResult(requestId) {
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
      model = 'flux-pro' // 'flux-pro' = Kontext Pro, 'flux-max' = Kontext Max
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

    // Skip credit checks for testing if user not authenticated
    if (userId) {
      // Check credits before processing (only if authenticated)
      const modelId = model || 'flux-pro';
      const requiredCredits = getModelCredits(modelId);
      
      try {
        // Make API call to check user credits
        const creditCheckResponse = await axios.post('http://localhost:5000/api/users/check-credits', {
          modelId
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });

        if (!creditCheckResponse.data.canAfford) {
          return res.status(400).json({ 
            error: 'Insufficient credits',
            required: requiredCredits,
            available: creditCheckResponse.data.available,
            modelId
          });
        }
      } catch (creditError) {
        console.log('Credit check failed, proceeding with generation for testing:', creditError.message);
      }
    } else {
      console.log('User not authenticated, skipping credit checks for testing');
    }

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // Select Kontext API endpoint based on model
    const apiUrl = model === 'flux-max' ? FLUX_KONTEXT_MAX_URL : FLUX_KONTEXT_PRO_URL;
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

    // Make request to Flux.1 Kontext API (specialized for image editing)
    const response = await axios.post(apiUrl, {
      prompt: fullPrompt,
      input_image: input_image // Kontext requires base64 image for editing
    }, {
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Kontext API response status:', response.status);
    console.log('Kontext API response data:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.id) {
      // Use polling_url from response if available (like in anime-generator)
      const taskId = response.data.id;
      const pollingUrl = response.data.polling_url;
      console.log(`📋 Task created with ID: ${taskId}`);
      console.log(`🔍 Polling URL: ${pollingUrl}`);
      
      // Start polling for result using the proper polling URL
      const result = await pollForKontextResult(taskId, pollingUrl);
      
      // If generation was successful, deduct credits
      if (result.success) {
        try {
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
            }
          });
          console.log(`Successfully deducted ${requiredCredits} credits for ${modelId}`);
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else {
      throw new Error('No request ID received from Flux Kontext API');
    }
  } catch (error) {
    console.error('Flux image-to-image generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};