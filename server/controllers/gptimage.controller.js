import axios from 'axios';
import { uploadToImgbb } from '../utils/imageUpload.js';

const GPT_IMAGE_API_KEY = process.env.GPT_IMAGE_API_KEY || 'b5cfe077850a194e434914eedd7111d5';
const GPT_IMAGE_API_URL = 'https://api.kie.ai/api/v1/gpt4o-image/generate';
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_TIME = 180000; // 3 minutes

/**
 * Generate image with GPT IMAGE API
 */
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, aspectRatio = '1:1' } = req.body;

    // Validate input
    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    console.log('GPT IMAGE request:', { style, aspectRatio });

    // Upload image to get public URL
    const imageUrl = await uploadToImgbb(input_image);

    // Call GPT IMAGE API
    const taskId = await createGenerationTask(imageUrl, prompt, aspectRatio);
    
    // Poll for result
    const result = await pollForResult(taskId);
    
    res.json(result);
  } catch (error) {
    console.error('GPT IMAGE error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
};

/**
 * Create generation task with GPT IMAGE API
 */
async function createGenerationTask(imageUrl, prompt, aspectRatio) {
  const response = await axios.post(GPT_IMAGE_API_URL, {
    filesUrl: [imageUrl],
    prompt: prompt,
    size: aspectRatio,
    isEnhance: true,
    uploadCn: false,
    nVariants: 1,
    enableFallback: false
  }, {
    headers: {
      'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.data?.data?.taskId) {
    throw new Error('Failed to create generation task');
  }

  console.log('Task created:', response.data.data.taskId);
  return response.data.data.taskId;
}

/**
 * Poll for generation result
 */
async function pollForResult(taskId) {
  const maxAttempts = Math.floor(MAX_POLL_TIME / POLL_INTERVAL);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get('https://api.kie.ai/api/v1/gpt4o-image/record-info', {
        params: { taskId },
        headers: {
          'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.code !== 200) {
        throw new Error(`API error: ${response.data?.msg || 'Unknown error'}`);
      }
      
      const taskData = response.data.data;
      
      // Check task status
      if (taskData.status === 'SUCCESS' && taskData.response?.resultUrls?.[0]) {
        console.log('Generation complete!');
        return {
          success: true,
          image: taskData.response.resultUrls[0]
        };
      }
      
      if (taskData.status === 'CREATE_TASK_FAILED' || taskData.status === 'GENERATE_FAILED') {
        throw new Error(`Generation failed: ${taskData.errorMessage || taskData.status}`);
      }
      
      // Still generating
      console.log(`Polling attempt ${attempt}/${maxAttempts}, progress: ${taskData.progress || '0.00'}`);
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`Poll error (attempt ${attempt}):`, error.message);
    }
  }
  
  throw new Error('Generation timeout after 3 minutes');
}