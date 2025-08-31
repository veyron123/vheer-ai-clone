import axios from 'axios';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY || 'b5cfe077850a194e434914eedd7111d5';
const MIDJOURNEY_API_URL = 'https://api.kie.ai/api/v1/mj';

// Generate image-to-image with Midjourney
export const generateImageToImage = async (req, res) => {
  console.log('🚨 MIDJOURNEY CONTROLLER REACHED - Request received');
  console.log('🚨 Request body keys:', Object.keys(req.body || {}));
  console.log('🚨 Request method:', req.method);
  console.log('🚨 Request URL:', req.url);
  
  try {
    const { 
      prompt, 
      negative_prompt, 
      input_image, 
      creative_strength = 0.5,
      control_strength = 0.4,
      aspectRatio = '1:1' 
    } = req.body;

    console.log('Midjourney image-to-image request:', { 
      hasPrompt: !!prompt, 
      hasNegative: !!negative_prompt,
      hasImage: !!input_image,
      creative_strength,
      control_strength,
      aspectRatio
    });

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // First, we need to upload the base64 image to a public URL
    // For now, we'll use imgbb as we did for GPT Image
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd5872cba0cfa53b44580045b14466f9c';
    
    // Remove data:image prefix if present (ImgBB expects clean base64)
    const cleanBase64 = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);
    
    const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!imgbbResponse.data || !imgbbResponse.data.data || !imgbbResponse.data.data.url) {
      throw new Error('Failed to upload image to imgbb');
    }

    const imageUrl = imgbbResponse.data.data.url;
    console.log('Image uploaded to imgbb:', imageUrl);

    // Combine prompts for better results
    const fullPrompt = `${prompt}. ${negative_prompt ? `--no ${negative_prompt}` : ''}`;

    // Calculate stylization based on creative_strength (100-1000 according to docs)
    // Higher creative = higher stylization
    const stylization = Math.round(100 + (creative_strength * 400)); // Range: 100-500 (safer range)

    // According to API error, parameter is called "weirdness" and must be 0-3000
    // Lower control = higher weirdness (more variation)
    const weirdness = Math.round((1 - control_strength) * 500); // Range: 0-500 (safe range within 0-3000)

    console.log('Midjourney parameters:', {
      stylization,
      weirdness,
      creative_strength,
      control_strength,
      aspectRatio
    });

    // Make request to Midjourney API for image-to-image according to NEW documentation
    const response = await axios.post(`${MIDJOURNEY_API_URL}/generate`, {
      taskType: 'mj_img2img',
      prompt: fullPrompt,
      fileUrls: [imageUrl], // Use fileUrls array instead of fileUrl (new format)
      aspectRatio: aspectRatio,
      version: '7', // Latest Midjourney version
      stylization: stylization,
      weirdness: weirdness, // Keep weirdness as API still requires it
      variety: Math.round(weirdness / 10), // Also add variety (0-100, increment by 5)
      speed: 'relaxed' // Use relaxed for free tier as per documentation
    }, {
      headers: {
        'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Midjourney API response:', response.data);

    if (response.data && response.data.code === 200 && response.data.data && response.data.data.taskId) {
      // Start polling for result
      const result = await pollForResult(response.data.data.taskId);
      res.json(result);
    } else {
      console.error('Unexpected Midjourney API response format:', response.data);
      throw new Error(`No task ID received from Midjourney API. Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logAIServiceError(error, 'Midjourney', 'Image-to-image generation');
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Midjourney');
    
    res.status(500).json({ 
      error: userFriendlyMessage,
      details: error.response?.data || error.message 
    });
  }
};

// Poll for generation result
async function pollForResult(taskId) {
  const maxAttempts = 300; // 5 minutes timeout (300 * 1 second) - Midjourney relaxed mode is slow
  const pollInterval = 1000; // 1 second between polls
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${MIDJOURNEY_API_URL}/record-info`, {
        params: {
          taskId: taskId
        },
        headers: {
          'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`
        }
      });
      
      console.log(`Polling attempt ${i + 1}, response:`, JSON.stringify(response.data, null, 2));
      
      // Check response according to documentation format
      if (response.data && response.data.code === 200 && response.data.data) {
        // successFlag: 0 = processing, 1 = success, -1 = failed
        if (response.data.data.successFlag === 1) {
          // Generation successful
          const resultUrls = response.data.data.resultInfoJson?.resultUrls || [];
          if (resultUrls.length > 0) {
            // Return the first generated image
            console.log('Midjourney generation completed successfully!');
            return {
              success: true,
              image: resultUrls[0].resultUrl
            };
          }
          throw new Error('No result URLs in successful response');
        } else if (response.data.data.successFlag === -1) {
          // Generation failed
          throw new Error(`Generation failed: ${response.data.data.errorMessage || 'Unknown error'}`);
        }
        // Still processing (successFlag === 0)
      } else {
        console.error('Unexpected polling response format:', response.data);
      }
      
      // Still processing, wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Polling error:', error.message);
      if (i === maxAttempts - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Generation timeout after 5 minutes');
}

// Generate text-to-image with Midjourney (for future use)
export const generateTextToImage = async (req, res) => {
  try {
    const { 
      prompt, 
      aspectRatio = '1:1',
      stylization = 100,
      chaos = 0,
      version = '7'
    } = req.body;

    console.log('Midjourney text-to-image request:', { 
      hasPrompt: !!prompt,
      aspectRatio,
      stylization,
      chaos,
      version
    });

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      });
    }

    // Make request to Midjourney API
    const response = await axios.post(`${MIDJOURNEY_API_URL}/generate`, {
      taskType: 'mj_txt2img',
      prompt: prompt,
      aspectRatio: aspectRatio,
      version: version,
      stylization: stylization,
      chaos: chaos,
      speed: 'fast'
    }, {
      headers: {
        'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Midjourney API response:', response.data);

    if (response.data && response.data.data && response.data.data.taskId) {
      const result = await pollForResult(response.data.data.taskId);
      res.json(result);
    } else {
      throw new Error('No task ID received from Midjourney API');
    }
  } catch (error) {
    logAIServiceError(error, 'Midjourney', 'Text-to-image generation');
    const userFriendlyMessage = getUserFriendlyAIError(error, 'Midjourney');
    
    res.status(500).json({ 
      error: userFriendlyMessage,
      details: error.response?.data || error.message 
    });
  }
};