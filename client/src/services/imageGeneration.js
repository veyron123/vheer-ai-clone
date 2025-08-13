import { fal } from "@fal-ai/client";

// Configure API key from environment variable
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY || "e405913f-48b3-42e6-9016-cddd8844add5:20315b83d223a2b6664fe3945238f67d"
});

// Flux API configuration
const FLUX_API_KEY = import.meta.env.VITE_FLUX_API_KEY || "2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0";
const FLUX_API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";

// Map of anime styles to their prompts and parameters
const animeStylePrompts = {
  disney: {
    prefix: "Disney Pixar 3D animation style, cute cartoon character",
    suffix: "vibrant colors, smooth rendering, family-friendly",
    negative: "realistic, photograph, scary, dark"
  },
  pixar: {
    prefix: "Pixar 3D animated character, high quality render",
    suffix: "bright lighting, expressive eyes, smooth textures",
    negative: "realistic photo, dark, horror"
  },
  'dc-comics': {
    prefix: "DC Comics superhero style, comic book art",
    suffix: "dynamic pose, bold colors, heroic",
    negative: "cute, childish, soft"
  },
  cyberpunk: {
    prefix: "Cyberpunk anime style, futuristic",
    suffix: "neon lights, tech wear, digital art",
    negative: "medieval, old, rustic"
  },
  'pop-art': {
    prefix: "Pop art style portrait, Andy Warhol inspired",
    suffix: "bold colors, high contrast, artistic",
    negative: "realistic, dark, muted colors"
  },
  'black-white': {
    prefix: "Black and white manga style, detailed line art",
    suffix: "high contrast, ink drawing, comic style",
    negative: "color, painted, realistic photo"
  },
  'bright-realistic': {
    prefix: "Bright anime style, semi-realistic",
    suffix: "soft lighting, detailed features, vibrant",
    negative: "dark, gloomy, scary"
  },
  fantasy: {
    prefix: "Fantasy anime art style, magical",
    suffix: "ethereal lighting, mystical atmosphere",
    negative: "modern, urban, realistic"
  },
  'cartoon-poster': {
    prefix: "Cartoon poster style, bold illustration",
    suffix: "flat colors, clean lines, poster art",
    negative: "realistic, 3D render, photograph"
  },
  inkpunk: {
    prefix: "Inkpunk style, detailed ink illustration",
    suffix: "intricate linework, crosshatching, artistic",
    negative: "color, simple, minimal"
  },
  springfield: {
    prefix: "Springfield cartoon style, yellow skin tone",
    suffix: "simple features, cartoon comedy style",
    negative: "realistic, detailed, complex"
  },
  claymation: {
    prefix: "Claymation style, stop motion aesthetic",
    suffix: "textured, handmade look, whimsical",
    negative: "smooth, digital, realistic"
  },
  'anime-sketch': {
    prefix: "Anime pencil sketch style, rough drawing",
    suffix: "sketch lines, unfinished look, artistic",
    negative: "colored, polished, photo"
  },
  manga: {
    prefix: "Japanese manga style, black and white",
    suffix: "screen tones, expressive eyes, dramatic",
    negative: "western comic, realistic, color"
  },
  'retro-anime': {
    prefix: "90s retro anime style, nostalgic",
    suffix: "cel shading, vintage colors, classic anime",
    negative: "modern, CGI, realistic"
  },
  'neon-punk': {
    prefix: "Neon punk anime style, glowing effects",
    suffix: "neon colors, cyberpunk aesthetic, vibrant",
    negative: "natural, soft, muted"
  }
};

/**
 * Convert image to base64 if it's a URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Base64 encoded image
 */
async function urlToBase64(imageUrl) {
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Generate anime-style image using Flux.1 Kontext
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} style - Selected anime style
 * @param {string} model - Flux model to use ('flux-pro' or 'flux-max')
 * @returns {Promise} Generated image data
 */
export async function generateWithFlux(imageBase64, style = 'disney', model = 'flux-pro') {
  try {
    const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
    
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const prompt = `Transform this photo into ${styleConfig.prefix} style, ${styleConfig.suffix}. Make it look like a professional ${style} animation character portrait.`;
    
    // Use our backend proxy to avoid CORS issues
    const response = await fetch('http://localhost:5000/api/flux/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        input_image: base64Only,
        style: style,
        model: model
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.image) {
      return {
        images: [{
          url: result.image,
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      };
    }
    
    throw new Error(result.error || 'Failed to generate image');
  } catch (error) {
    console.error('Error generating with Flux:', error);
    throw error;
  }
}

/**
 * Generate anime-style image from uploaded photo
 * @param {string} imageUrl - URL or base64 of the uploaded image
 * @param {string} style - Selected anime style
 * @param {string} aiModel - AI model to use ('flux-pro', 'flux-max', or 'gpt-image')
 * @returns {Promise} Generated image data
 */
export async function generateAnimeImage(imageUrl, style = 'disney', aiModel = 'flux-pro') {
  // Use Flux for image-to-image generation
  if (aiModel === 'flux-pro' || aiModel === 'flux-max') {
    return await generateWithFlux(imageUrl, style, aiModel);
  }
  
  // Use GPT IMAGE for image-to-image generation
  if (aiModel === 'gpt-image') {
    try {
      const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
      
      // Ensure image is in base64 format
      let base64Data = imageUrl;
      if (!imageUrl.startsWith('data:')) {
        base64Data = await urlToBase64(imageUrl);
      }
      
      // Remove data URL prefix if present
      const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Construct the prompt for GPT IMAGE
      const prompt = `Transform this photo into ${styleConfig.prefix} anime style, ${styleConfig.suffix}, high quality anime portrait, masterpiece`;
      
      // Use our backend proxy for GPT IMAGE API
      const response = await fetch('http://localhost:5000/api/gptimage/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          input_image: base64Only,
          style: style
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.image) {
        return {
          images: [{
            url: result.image,
            width: 1024,
            height: 1024,
            content_type: 'image/png'
          }]
        };
      }
      
      throw new Error(result.error || 'Failed to generate image');
    } catch (error) {
      console.error("Error generating with GPT IMAGE:", error);
      throw error;
    }
  }
}

/**
 * Generate image from text prompt
 * @param {string} prompt - Text prompt for generation
 * @param {object} options - Generation options
 * @returns {Promise} Generated image data
 */
export async function generateImageFromText(prompt, options = {}) {
  try {
    const {
      imageSize = 'landscape_4_3',
      numSteps = 30,
      guidanceScale = 2.5,
      negativePrompt = 'blurry, ugly, distorted',
      acceleration = 'regular'
    } = options;
    
    const result = await fal.subscribe("fal-ai/qwen-image", {
      input: {
        prompt: prompt,
        image_size: imageSize,
        num_inference_steps: numSteps,
        guidance_scale: guidanceScale,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
        negative_prompt: negativePrompt,
        acceleration: acceleration
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generating image...");
        }
      },
    });
    
    return result.data;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

/**
 * Upload image file to fal.ai storage
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded image
 */
export async function uploadImage(file) {
  try {
    const url = await fal.storage.upload(file);
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}