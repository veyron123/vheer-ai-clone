import axios from 'axios';

const FLUX_API_KEY = process.env.FLUX_API_KEY || '2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0';
const FLUX_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';

// Model configurations
const MODEL_CONFIG = {
  'flux-pro': { steps: 28 },
  'flux-max': { steps: 50 }
};

/**
 * Generate image with Flux API
 */
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, model = 'flux-pro' } = req.body;
    
    // Validate input
    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }
    
    // Get model configuration
    const config = MODEL_CONFIG[model] || MODEL_CONFIG['flux-pro'];
    console.log(`Using ${model} with ${config.steps} steps`);
    
    // Call Flux API
    const result = await callFluxAPI(prompt, input_image, config.steps);
    
    res.json({
      success: true,
      image: result.sample
    });
  } catch (error) {
    console.error('Flux API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data?.error || error.message 
    });
  }
};

/**
 * Call Flux API
 */
async function callFluxAPI(prompt, imageBase64, steps) {
  const response = await axios.post(
    FLUX_API_URL,
    {
      prompt,
      control_image: imageBase64,
      control_strength: 0.9,
      steps,
      width: 1024,
      height: 1024,
      guidance: 2.5,
      output_format: 'jpeg',
      safety_tolerance: 6,
      seed: Math.floor(Math.random() * 1000000)
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-BFL-API-KEY': FLUX_API_KEY
      }
    }
  );
  
  if (!response.data?.sample) {
    throw new Error('No image returned from Flux API');
  }
  
  return response.data;
}