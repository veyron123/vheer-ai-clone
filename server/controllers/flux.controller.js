import axios from 'axios';
import { getModelCredits, canAffordGeneration } from '../config/pricing.config.js';

const FLUX_API_KEY = process.env.FLUX_API_KEY || '2286be72f9c75b12557518051d46c551';
const FLUX_API_URL = process.env.FLUX_API_URL || 'https://api.kie.ai/api/v1/flux/kontext/generate';

// Flux Kontext models endpoints at kie.ai
const FLUX_KONTEXT_API_URL = 'https://api.kie.ai/api/v1/flux/kontext/generate';
const FLUX_STATUS_URL = 'https://api.kie.ai/api/v1/flux/kontext/record-info';

console.log('Flux API configuration:', {
  FLUX_API_KEY: FLUX_API_KEY ? `Set (${FLUX_API_KEY.substring(0, 8)}...)` : 'Not set',
  FLUX_API_URL,
  NODE_ENV: process.env.NODE_ENV
});

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

    console.log('Flux generation request:', { 
      style, 
      model, 
      aspectRatio, 
      hasPrompt: !!prompt, 
      hasImage: !!input_image, 
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

    // Make request to Flux Kontext API at kie.ai
    const requestBody = {
      prompt: prompt,
      aspectRatio: aspectRatio || '1:1',  // Use provided aspect ratio or default to 1:1
      model: model === 'flux-max' ? 'flux-kontext-max' : 'flux-kontext-pro',
      enableTranslation: true,
      outputFormat: 'jpeg'
    };
    
    // Add input image if provided (for image-to-image)
    if (input_image) {
      // If it's base64, try to upload to ImgBB first
      if (!input_image.startsWith('http')) {
        try {
          const formData = new URLSearchParams();
          formData.append('key', 'd5872cba0cfa53b44580045b14466f9c');
          const cleanBase64 = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
          formData.append('image', cleanBase64);
          
          const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
          });
          
          if (imgbbResponse.data?.data?.url) {
            requestBody.inputImage = imgbbResponse.data.data.url;
            console.log('Image uploaded to ImgBB:', requestBody.inputImage);
          }
        } catch (uploadError) {
          console.error('ImgBB upload failed:', uploadError.message);
          // Try to use base64 directly
          requestBody.inputImage = input_image;
        }
      } else {
        requestBody.inputImage = input_image;
      }
    }
    
    console.log('Flux Kontext API request:', requestBody);
    
    const response = await axios.post(FLUX_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${FLUX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flux API response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === 200 && response.data.data.taskId) {
      // Start polling for result using the taskId
      const result = await pollForFluxKontextResult(response.data.data.taskId, req);
      
      // If generation was successful and user is authenticated, deduct credits
      if (result.success && userId) {
        const modelId = model || 'flux-pro';
        const requiredCredits = getModelCredits(modelId);
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

// Poll for Flux Kontext result at kie.ai
async function pollForFluxKontextResult(taskId, req = null) {
  const maxAttempts = 100; // 5 minutes timeout  
  const pollInterval = 3000; // 3 seconds between polls
  
  console.log(`Starting to poll Flux Kontext for task: ${taskId}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    // Check if request was aborted
    if (req && req.aborted) {
      console.log(`Polling cancelled for task: ${taskId}`);
      throw new Error('Request was cancelled');
    }
    
    try {
      const response = await axios.get(`${FLUX_STATUS_URL}?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${FLUX_API_KEY}`
        }
      });
      
      console.log(`Poll attempt ${i + 1}, status:`, response.data?.data?.successFlag);
      
      if (response.data && response.data.code === 200 && response.data.data) {
        const taskData = response.data.data;
        
        // Check success flag: 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
        if (taskData.successFlag === 1 && taskData.response) {
          console.log('Flux Kontext generation completed successfully!');
          return {
            success: true,
            image: taskData.response.resultImageUrl || taskData.response.originImageUrl
          };
        } else if (taskData.successFlag === 2 || taskData.successFlag === 3) {
          throw new Error(`Generation failed: ${taskData.errorMessage || 'Unknown error'}`);
        }
        // successFlag === 0 means still generating, continue polling
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Polling error:', error.message);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Flux Kontext generation timeout');
}

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

    // Use the same API endpoint for both models (they differentiate by model parameter)
    const apiUrl = FLUX_KONTEXT_API_URL;
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
      inputImage: input_image, // Kontext requires base64 image for editing
      model: model === 'flux-max' ? 'flux-kontext-max' : 'flux-kontext-pro',
      aspectRatio: aspectRatio || '1:1',  // Use provided aspect ratio or default to 1:1
      enableTranslation: true,
      outputFormat: 'jpeg'
    }, {
      headers: {
        'Authorization': `Bearer ${FLUX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Kontext API response status:', response.status);
    console.log('Kontext API response data:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === 200 && response.data.data.taskId) {
      // Use taskId from response
      const taskId = response.data.data.taskId;
      console.log(`📋 Task created with ID: ${taskId}`);
      
      // Start polling for result using the taskId
      const result = await pollForFluxKontextResult(taskId, req);
      
      // If generation was successful and user is authenticated, deduct credits
      if (result.success && userId) {
        const modelId = model || 'flux-pro';
        const requiredCredits = getModelCredits(modelId);
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