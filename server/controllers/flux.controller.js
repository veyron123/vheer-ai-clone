import axios from 'axios';

const FLUX_API_KEY = process.env.FLUX_API_KEY || '2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0';
const FLUX_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';

// Generate image with Flux
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, model } = req.body;

    console.log('Flux generation request:', { style, model, hasPrompt: !!prompt, hasImage: !!input_image });

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

    // Make request to Flux API
    const response = await axios.post(FLUX_API_URL, {
      prompt,
      input_image,
      width: 1024,
      height: 1024,
      steps: steps,
      guidance: 30,
      safety_tolerance: 6,
      interval: 1,
      image_prompt_strength: 0.1
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

// Poll for generation result
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