import axios from 'axios';

const GPT_IMAGE_API_KEY = process.env.GPT_IMAGE_API_KEY || 'b5cfe077850a194e434914eedd7111d5';
const GPT_IMAGE_API_URL = 'https://api.kie.ai/api/v1/gpt4o-image/generate';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd5872cba0cfa53b44580045b14466f9c';

// Generate image with GPT IMAGE 1
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, aspectRatio = '1:1' } = req.body;

    // Map our aspect ratios to GPT Image supported formats
    // GPT Image only supports: "1:1", "3:2", "2:3"
    let gptImageSize = '1:1'; // default
    
    switch(aspectRatio) {
      case '1:1':
        gptImageSize = '1:1';
        break;
      case '16:9':
      case '4:3':
        gptImageSize = '3:2'; // landscape formats map to 3:2
        break;
      case '9:16':
      case '3:4':
        gptImageSize = '2:3'; // portrait formats map to 2:3
        break;
      case 'match':
        // For match, we'll default to 1:1
        // This could be improved by analyzing the input image aspect ratio
        gptImageSize = '1:1';
        break;
      default:
        gptImageSize = '1:1';
    }

    console.log('GPT IMAGE generation request:', { 
      style, 
      originalAspectRatio: aspectRatio,
      mappedSize: gptImageSize, 
      hasPrompt: !!prompt, 
      hasImage: !!input_image 
    });

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // GPT IMAGE requires a public URL, not base64
    // We need to upload the image somewhere first
    // For now, we'll use a free image hosting service
    
    let imageUrl = input_image;
    
    // If it's base64, we need to upload it to get a URL
    if (!input_image.startsWith('http')) {
      // Convert base64 to blob and upload to imgbb
      try {
        // Create form data for imgbb
        const formData = new URLSearchParams();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', input_image);
        
        const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (imgbbResponse.data && imgbbResponse.data.data && imgbbResponse.data.data.url) {
          imageUrl = imgbbResponse.data.data.url;
          console.log('Image uploaded to:', imageUrl);
        } else {
          throw new Error('Failed to upload image to hosting service');
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error('Failed to upload image for processing');
      }
    }

    // Make request to GPT IMAGE API
    const response = await axios.post(GPT_IMAGE_API_URL, {
      filesUrl: [imageUrl],
      prompt: prompt,
      size: gptImageSize,  // Use the mapped size that GPT Image supports
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

    console.log('GPT IMAGE response:', response.data);

    if (response.data && response.data.data && response.data.data.taskId) {
      // Start polling for result using the taskId with the correct endpoint
      const result = await pollForResult(response.data.data.taskId);
      res.json(result);
    } else if (response.data && response.data.data && response.data.data.images) {
      // Direct response with images (unlikely with GPT IMAGE)
      res.json({
        success: true,
        image: response.data.data.images[0]
      });
    } else {
      throw new Error('Unexpected response from GPT IMAGE API: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('GPT IMAGE generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};

// Poll for generation result
async function pollForResult(taskId) {
  const maxAttempts = 180; // 3 minutes timeout (GPT IMAGE очень медленный)
  const pollInterval = 3000; // 3 seconds between polls
  
  console.log(`Starting to poll for task: ${taskId}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Use the correct endpoint from documentation: /record-info
      const response = await axios.get(`https://api.kie.ai/api/v1/gpt4o-image/record-info`, {
        params: { taskId: taskId },
        headers: {
          'Authorization': `Bearer ${GPT_IMAGE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Poll attempt ${i + 1}, response:`, response.data);
      
      // Check response according to documentation
      if (response.data && response.data.code === 200 && response.data.data) {
        const taskData = response.data.data;
        
        // Check task status
        if (taskData.status === 'SUCCESS' && taskData.response && taskData.response.resultUrls) {
          // Task completed successfully
          console.log('Task completed successfully!');
          console.log('Full response data:', JSON.stringify(taskData.response, null, 2));
          
          // Try to get the correct image URL
          let imageUrl = taskData.response.resultUrls[0];
          
          // If it's a relative URL, prepend the base URL
          if (!imageUrl.startsWith('http')) {
            imageUrl = `https://images.kie.ai${imageUrl}`;
          }
          
          console.log('Final image URL:', imageUrl);
          
          return {
            success: true,
            image: imageUrl
          };
        } else if (taskData.status === 'GENERATING') {
          // Still generating
          console.log(`Task still generating... Progress: ${taskData.progress || '0.00'}`);
        } else if (taskData.status === 'CREATE_TASK_FAILED' || taskData.status === 'GENERATE_FAILED') {
          // Task failed
          throw new Error(`Generation failed: ${taskData.errorMessage || taskData.status}`);
        }
      } else if (response.data && response.data.code !== 200) {
        // API error
        throw new Error(`API error: ${response.data.msg || 'Unknown error'}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Polling error:', error.message);
      // If it's 404, the task might not be ready yet
      if (error.response && error.response.status === 404) {
        console.log('Task not found yet, waiting...');
      } else if (i === maxAttempts - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Generation timeout after 3 minutes. GPT IMAGE is very slow, please try again.');
}

// Generate image-to-image with GPT IMAGE
export const generateImageToImage = async (req, res) => {
  try {
    const { 
      prompt, 
      negative_prompt, 
      input_image, 
      creative_strength = 0.5,
      control_strength = 0.4,
      aspectRatio = '1:1' 
    } = req.body;

    // Map our aspect ratios to GPT Image supported formats
    let gptImageSize = '1:1';
    
    switch(aspectRatio) {
      case '1:1':
        gptImageSize = '1:1';
        break;
      case '16:9':
      case '4:3':
        gptImageSize = '3:2';
        break;
      case '9:16':
      case '3:4':
        gptImageSize = '2:3';
        break;
      case 'match':
        gptImageSize = '1:1';
        break;
      default:
        gptImageSize = '1:1';
    }

    console.log('GPT IMAGE image-to-image request:', { 
      originalAspectRatio: aspectRatio,
      mappedSize: gptImageSize, 
      hasPrompt: !!prompt,
      hasNegative: !!negative_prompt,
      hasImage: !!input_image 
    });

    if (!prompt || !input_image) {
      return res.status(400).json({ 
        error: 'Prompt and input_image are required' 
      });
    }

    // Combine prompts for better results
    const fullPrompt = `${prompt}. ${negative_prompt ? `Avoid: ${negative_prompt}` : ''}`;

    // First, upload the base64 image to imgbb
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

    // Calculate guidance_scale based on control_strength (range: 1-10)
    // Higher control = higher guidance_scale (more adherence to prompt)
    const guidanceScale = 3 + (control_strength * 7); // Range: 3-10
    
    // Calculate num_inference_steps based on creative_strength (range: 20-50)
    // Higher creative = more inference steps (more creative variations)
    const inferenceSteps = 20 + Math.round(creative_strength * 30); // Range: 20-50

    console.log('GPT Image parameters:', {
      guidanceScale,
      inferenceSteps,
      creative_strength,
      control_strength
    });

    // Make request to GPT IMAGE API - same format as anime generator
    const response = await axios.post(GPT_IMAGE_API_URL, {
      filesUrl: [imageUrl],
      prompt: fullPrompt,
      size: gptImageSize,
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

    console.log('GPT IMAGE API response:', response.data);

    if (response.data && response.data.data && response.data.data.taskId) {
      // Start polling for result using the taskId with the correct endpoint
      const result = await pollForResult(response.data.data.taskId);
      res.json(result);
    } else if (response.data && response.data.data && response.data.data.images) {
      // Direct response with images (unlikely with GPT IMAGE)
      res.json({
        success: true,
        image: response.data.data.images[0]
      });
    } else {
      throw new Error('Unexpected response from GPT IMAGE API: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('GPT IMAGE image-to-image generation error:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
};