import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { getModelCredits } from '../config/pricing.config.js';
import { saveGeneratedImage } from './images.controller.js';

const prisma = new PrismaClient();

const GPT_IMAGE_API_KEY = process.env.GPT_IMAGE_API_KEY || 'b5cfe077850a194e434914eedd7111d5';
const GPT_IMAGE_API_URL = process.env.GPT_IMAGE_API_URL || 'https://api.kie.ai/api/v1/gpt4o-image/generate';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd5872cba0cfa53b44580045b14466f9c';

console.log('GPT Image API configuration:', {
  GPT_IMAGE_API_KEY: GPT_IMAGE_API_KEY ? 'Set' : 'Not set',
  GPT_IMAGE_API_URL,
  IMGBB_API_KEY: IMGBB_API_KEY ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});

// Generate image with GPT IMAGE 1
export const generateImage = async (req, res) => {
  try {
    const { prompt, input_image, style, aspectRatio = '1:1' } = req.body;
    const userId = req.user?.id;

    // Skip credit checks for testing if user not authenticated
    if (userId) {
      // Check credits before processing (only if authenticated)
      const modelId = 'gpt-image';
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

    // Try different approaches for image handling
    let imageUrl = input_image;
    
    // If it's base64, try to upload it to a hosting service
    if (!input_image.startsWith('http')) {
      // Try uploading to Cloudinary first (more reliable than ImgBB)
      try {
        console.log('🔄 Attempting to upload image to Cloudinary...');
        console.log('🔍 Input image type:', typeof input_image);
        console.log('🔍 Input image starts with data:', input_image.startsWith('data:'));
        console.log('🔍 Input image length:', input_image.length);
        
        const { getStorageProvider } = await import('../utils/storageProvider.js');
        const storageProvider = getStorageProvider();
        
        // Upload image using our universal storage provider
        const uploadResult = await storageProvider.uploadImage(input_image, 'gpt-input');
        imageUrl = uploadResult.url;
        console.log('✅ Image successfully uploaded to Cloudinary:', imageUrl);
        
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
        
        // Fallback to ImgBB if Cloudinary fails
        try {
          console.log('🔄 Fallback: Attempting to upload image to ImgBB...');
          const formData = new URLSearchParams();
          formData.append('key', IMGBB_API_KEY);
          // Clean the base64 string by removing data URL prefix if present
          const cleanBase64 = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
          formData.append('image', cleanBase64);
          
          const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000 // 10 second timeout
          });
          
          if (imgbbResponse.data && imgbbResponse.data.data && imgbbResponse.data.data.url) {
            imageUrl = imgbbResponse.data.data.url;
            console.log('✅ Image successfully uploaded to ImgBB:', imageUrl);
          } else {
            throw new Error('Invalid response from ImgBB');
          }
        } catch (uploadError) {
          console.error('❌ Both Cloudinary and ImgBB upload failed:', uploadError.message);
          
          // If both uploads fail, try direct base64 approach with GPT Image
          console.log('Trying direct base64 approach...');
          
          // Some APIs accept direct base64, try this approach
          if (input_image.startsWith('data:image')) {
            imageUrl = input_image;
          } else {
            // Add data URL prefix if missing
            imageUrl = `data:image/jpeg;base64,${input_image}`;
          }
          console.log('Using direct base64 approach for GPT Image API');
        }
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
      
      // If generation was successful and user is authenticated, deduct credits and save image
      if (result.success && userId) {
        const modelId = 'gpt-image';
        const requiredCredits = getModelCredits(modelId);
        
        try {
          // Deduct credits first
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
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
                style: style || '',
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
              console.log('GPT Image saved to user gallery');
            } catch (saveError) {
              console.log('GPT Image not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else if (response.data && response.data.data && response.data.data.images) {
      // Direct response with images (unlikely with GPT IMAGE)
      
      // Deduct credits for successful generation if user is authenticated
      if (userId) {
        const modelId = 'gpt-image';
        const requiredCredits = getModelCredits(modelId);
        try {
          // Deduct credits first
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
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
                style: style || '',
                status: 'COMPLETED',
                creditsUsed: requiredCredits,
                completedAt: new Date()
              }
            });
            
            // Try to save the generated image for eligible users
            try {
              await saveGeneratedImage(
                { url: response.data.data.images[0], width: 1024, height: 1024 },
                user,
                generation
              );
              console.log('GPT Image (direct response) saved to user gallery');
            } catch (saveError) {
              console.log('GPT Image (direct response) not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
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
  const maxAttempts = 120; // 12 minutes timeout (GPT IMAGE очень медленный)
  const pollInterval = 6000; // 6 seconds between polls (более редкие запросы)
  
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
    const userId = req.user?.id;

    // Skip credit checks for testing if user not authenticated
    if (userId) {
      // Check credits before processing (only if authenticated)
      const modelId = 'gpt-image';
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

    // Try different approaches for image handling
    let imageUrl = input_image;
    
    // If it's base64, try to upload it to a hosting service
    if (!input_image.startsWith('http')) {
      try {
        console.log('Attempting to upload image to ImgBB for image-to-image...');
        const cleanBase64 = input_image.replace(/^data:image\/[a-z]+;base64,/, '');
        
        const formData = new URLSearchParams();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', cleanBase64);
        
        const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000 // 10 second timeout
        });

        if (imgbbResponse.data && imgbbResponse.data.data && imgbbResponse.data.data.url) {
          imageUrl = imgbbResponse.data.data.url;
          console.log('Image successfully uploaded to ImgBB:', imageUrl);
        } else {
          throw new Error('Invalid response from ImgBB');
        }
      } catch (uploadError) {
        console.error('ImgBB upload failed for image-to-image:', uploadError.message);
        
        // If ImgBB fails, try direct base64 approach
        console.log('Trying direct base64 approach for image-to-image...');
        
        if (input_image.startsWith('data:image')) {
          imageUrl = input_image;
        } else {
          imageUrl = `data:image/jpeg;base64,${input_image}`;
        }
        console.log('Using direct base64 approach for GPT Image API (image-to-image)');
      }
    }

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
      
      // If generation was successful and user is authenticated, deduct credits and save image
      if (result.success && userId) {
        const modelId = 'gpt-image';
        const requiredCredits = getModelCredits(modelId);
        
        try {
          // Deduct credits first
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
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
                negativePrompt: negative_prompt || '',
                model: modelId,
                style: '',
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
              console.log('GPT Image (image-to-image) saved to user gallery');
            } catch (saveError) {
              console.log('GPT Image (image-to-image) not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
      res.json(result);
    } else if (response.data && response.data.data && response.data.data.images) {
      // Direct response with images (unlikely with GPT IMAGE)
      
      // Deduct credits for successful generation if user is authenticated
      if (userId) {
        const modelId = 'gpt-image';
        const requiredCredits = getModelCredits(modelId);
        try {
          // Deduct credits first
          await axios.post('http://localhost:5000/api/users/deduct-credits', {
            modelId
          }, {
            headers: {
              'Authorization': req.headers.authorization
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
                style: style || '',
                status: 'COMPLETED',
                creditsUsed: requiredCredits,
                completedAt: new Date()
              }
            });
            
            // Try to save the generated image for eligible users
            try {
              await saveGeneratedImage(
                { url: response.data.data.images[0], width: 1024, height: 1024 },
                user,
                generation
              );
              console.log('GPT Image (direct response) saved to user gallery');
            } catch (saveError) {
              console.log('GPT Image (direct response) not saved (user not eligible or error):', saveError.message);
            }
          }
          
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError.response?.data || creditError.message);
          // Still return the image but log the credit error
        }
      }
      
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