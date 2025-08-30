import { fal } from "@fal-ai/client";
import { getApiUrl } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { urlToBase64 } from '../utils/imageUtils';
import analytics from './analytics';
import { generateWithNanoBananaImageToImage } from './nanoBananaGeneration';

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
  },
  'voxel': {
    prefix: "Voxel art style, 3D pixel art",
    suffix: "blocky textures, minecraft-like, cubic forms",
    negative: "smooth, realistic, high detail"
  },
  'abstract-expressionist': {
    prefix: "Abstract expressionist art style",
    suffix: "bold brushstrokes, emotional colors, artistic",
    negative: "realistic, detailed, photographic"
  },
  'cubist': {
    prefix: "Cubist artwork style, geometric forms",
    suffix: "fragmented shapes, multiple perspectives, abstract",
    negative: "realistic, smooth, traditional"
  },
  'caricature': {
    prefix: "Caricature style, exaggerated features",
    suffix: "humorous proportions, cartoon-like, expressive",
    negative: "realistic, proportional, serious"
  },
  'chinese-paper-cutting': {
    prefix: "Chinese paper cutting art style",
    suffix: "intricate patterns, silhouette design, traditional",
    negative: "3D, realistic, modern"
  },
  // Style Transfer styles
  'studio-ghibli': {
    prefix: "Studio Ghibli anime style, magical realism",
    suffix: "whimsical atmosphere, detailed backgrounds, soft colors",
    negative: "dark, scary, realistic photo"
  },
  'pixar-style': {
    prefix: "Pixar 3D animation style, cartoon character",
    suffix: "vibrant colors, smooth rendering, expressive",
    negative: "realistic, dark, 2D"
  },
  'pixel-art': {
    prefix: "Pixel art style, 8-bit retro gaming",
    suffix: "blocky pixels, retro aesthetic, digital art",
    negative: "smooth, realistic, high resolution"
  },
  'marvel-comic-anime': {
    prefix: "Marvel comic anime fusion style",
    suffix: "superhero aesthetic, dynamic poses, bold colors",
    negative: "realistic, dark, minimalist"
  },
  'dc-comic': {
    prefix: "DC Comics art style, superhero illustration",
    suffix: "dramatic lighting, heroic poses, comic book",
    negative: "cute, childish, realistic photo"
  },
  'japanese-ukiyo-e': {
    prefix: "Japanese Ukiyo-e woodblock print style",
    suffix: "traditional patterns, flat colors, artistic",
    negative: "3D, realistic, modern"
  },
  'simpsons': {
    prefix: "The Simpsons cartoon style, yellow characters",
    suffix: "simple lines, bright colors, comedy style",
    negative: "realistic, detailed, dark"
  },
  'flat-illustration': {
    prefix: "Flat illustration style, minimalist design",
    suffix: "simple shapes, clean lines, modern",
    negative: "3D, realistic, detailed"
  },
  'childrens-book': {
    prefix: "Children's book illustration style",
    suffix: "whimsical, colorful, friendly characters",
    negative: "scary, dark, realistic"
  },
  'claymation': {
    prefix: "Claymation stop-motion style",
    suffix: "clay texture, handmade feel, tactile",
    negative: "smooth, digital, realistic"
  },
  'lego': {
    prefix: "LEGO minifigure style, plastic toy",
    suffix: "blocky construction, bright colors, toy-like",
    negative: "realistic, organic, soft"
  },
  'jojos-bizarre': {
    prefix: "JoJo's Bizarre Adventure manga style",
    suffix: "dramatic poses, bold lines, flamboyant",
    negative: "subtle, realistic, simple"
  },
  'knitted-yarn': {
    prefix: "Knitted yarn art style, textile craft",
    suffix: "soft textures, cozy feel, handmade",
    negative: "hard, metallic, digital"
  },
  'rick-morty': {
    prefix: "Rick and Morty cartoon style",
    suffix: "simple lines, bright colors, quirky",
    negative: "realistic, detailed, serious"
  },
  'kawaii-3d': {
    prefix: "Kawaii 3D character style, cute anime",
    suffix: "adorable features, pastel colors, chibi",
    negative: "scary, dark, realistic"
  },
  '3d person': {
    prefix: "3D character style, kawaii anime person",
    suffix: "cute features, soft rendering, adorable design",
    negative: "scary, dark, realistic, harsh"
  },
  'snoopy-comic': {
    prefix: "Classic comic strip style",
    suffix: "simple lines, minimalist cartoon, wholesome, friendly characters",
    negative: "complex, realistic, dark, detailed"
  },
  'minecraft': {
    prefix: "Minecraft voxel style, blocky 3D",
    suffix: "cubic shapes, pixelated textures, gaming",
    negative: "smooth, realistic, rounded"
  },
  'vintage-oil-painting-anime': {
    prefix: "Vintage oil painting anime style",
    suffix: "classical art meets anime, elegant brushwork",
    negative: "modern, digital, simple"
  },
  'watercolor': {
    prefix: "Watercolor painting style, flowing colors",
    suffix: "soft edges, transparent layers, artistic",
    negative: "sharp, digital, realistic photo"
  },
  'acrylic': {
    prefix: "Acrylic painting style, bold colors",
    suffix: "thick paint texture, vibrant hues, artistic",
    negative: "digital, transparent, muted"
  },
  'printmaking': {
    prefix: "Printmaking art style, etching technique",
    suffix: "carved lines, artistic impression, handcrafted",
    negative: "digital, smooth, photographic"
  },
  'mosaic': {
    prefix: "Mosaic art style, tile pattern",
    suffix: "small colored pieces, ancient technique",
    negative: "smooth, continuous, modern"
  },
  'fresco-mural': {
    prefix: "Fresco mural painting style, wall art",
    suffix: "large scale, classical technique, architectural",
    negative: "small, modern, digital"
  },
  'abstract-art': {
    prefix: "Abstract art style, non-representational",
    suffix: "geometric forms, bold colors, artistic",
    negative: "realistic, detailed, photographic"
  },
  'pop-art': {
    prefix: "Pop art style, Andy Warhol inspired",
    suffix: "bold colors, high contrast, commercial",
    negative: "realistic, muted, traditional"
  },
  'magical-fantasy-anime': {
    prefix: "Magical fantasy anime style, enchanted",
    suffix: "mystical elements, glowing effects, ethereal",
    negative: "realistic, modern, mundane"
  },
  'medieval-fantasy-anime': {
    prefix: "Medieval fantasy anime style, knights",
    suffix: "armor, castles, epic adventure, heroic",
    negative: "modern, sci-fi, realistic"
  },
  'gothic-fantasy-anime': {
    prefix: "Gothic fantasy anime style, dark romance",
    suffix: "dramatic shadows, mysterious atmosphere",
    negative: "bright, cheerful, realistic"
  },
  'cyberpunk-anime': {
    prefix: "Cyberpunk anime style, futuristic neon",
    suffix: "tech wear, neon lights, sci-fi aesthetic",
    negative: "natural, traditional, rustic"
  },
  'steampunk-anime': {
    prefix: "Steampunk anime style, Victorian sci-fi",
    suffix: "brass gears, steam power, retro-futuristic",
    negative: "modern, clean, minimalist"
  },
  'futuristic-scifi-anime': {
    prefix: "Futuristic sci-fi anime style, space age",
    suffix: "advanced technology, sleek design, cosmic",
    negative: "ancient, primitive, realistic"
  },
  'tezuka-osamu': {
    prefix: "Tezuka Osamu manga style, classic anime",
    suffix: "expressive eyes, clean lines, vintage",
    negative: "modern, realistic, complex"
  },
  'south-park': {
    prefix: "South Park cartoon style, cut-out animation",
    suffix: "simple shapes, flat colors, comedy",
    negative: "realistic, detailed, serious"
  },
  'magical-girl-anime': {
    prefix: "Magical girl anime style, sparkly transformation",
    suffix: "cute outfits, magical powers, pastel colors",
    negative: "dark, realistic, masculine"
  },
  'kemonomimi-furry-anime': {
    prefix: "Kemonomimi furry anime style, animal features",
    suffix: "cute ears, tail, anthropomorphic, adorable",
    negative: "human only, realistic, serious"
  },
  'bauhaus': {
    prefix: "Bauhaus design style, geometric modernism",
    suffix: "clean lines, functional design, minimalist",
    negative: "ornate, decorative, complex"
  },
  'glitch-art': {
    prefix: "Glitch art style, digital corruption",
    suffix: "pixelated errors, neon colors, cyberpunk",
    negative: "clean, perfect, traditional"
  },
  'van-gogh': {
    prefix: "Van Gogh painting style, post-impressionist",
    suffix: "swirling brushstrokes, vibrant colors, expressive",
    negative: "smooth, realistic, digital"
  },
  'picasso': {
    prefix: "Picasso cubist style, fragmented forms",
    suffix: "geometric shapes, multiple perspectives, abstract",
    negative: "realistic, smooth, traditional"
  },
  'monet': {
    prefix: "Claude Monet impressionist style",
    suffix: "light effects, soft brushwork, atmospheric",
    negative: "sharp, detailed, modern"
  },
  'childrens-crayon': {
    prefix: "Children's crayon drawing style, innocent art",
    suffix: "simple lines, bright colors, childlike",
    negative: "sophisticated, realistic, dark"
  },
  'graffiti': {
    prefix: "Graffiti street art style, urban expression",
    suffix: "spray paint, bold letters, street culture",
    negative: "clean, formal, traditional"
  },
  'sticker': {
    prefix: "Sticker art style, adhesive graphics",
    suffix: "bold outlines, simple shapes, graphic design",
    negative: "complex, realistic, subtle"
  },
  'geometric-softness': {
    prefix: "Geometric softness style, rounded shapes",
    suffix: "soft geometry, pastel colors, modern design",
    negative: "sharp, harsh, realistic"
  },
  'microtopia': {
    prefix: "Microtopia miniature world style",
    suffix: "tiny detailed scenes, macro photography feel",
    negative: "large scale, simple, realistic"
  }
};

/**
 * Convert image to base64 if it's a URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Base64 encoded image
 */
// urlToBase64 function removed - now imported from utils/imageUtils.js

/**
 * Generate anime-style image using Flux.1 Kontext
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} style - Selected anime style
 * @param {string} model - Flux model to use ('flux-pro')
 * @param {string} aspectRatio - Aspect ratio for generation
 * @param {AbortSignal} abortSignal - Signal to abort the request
 * @returns {Promise} Generated image data
 */
export async function generateWithFlux(imageBase64, style = 'disney', model = 'flux-pro', aspectRatio = '1:1', abortSignal = null, customPrompt = null) {
  const startTime = Date.now();
  
  // 📊 Track AI generation start
  analytics.aiGenerationStarted({
    model: model,
    style: style,
    prompt: customPrompt || 'image_to_image',
    aspectRatio: aspectRatio,
    userCredits: useAuthStore.getState().user?.totalCredits || 0,
    creditCost: model === 'flux-pro' ? 10 : 5
  });

  try {
    const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
    
    // Get auth token from store
    const token = useAuthStore.getState().token;
    
    // Ensure image is in base64 format
    let base64Data = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      base64Data = await urlToBase64(imageBase64);
    }
    
    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    let prompt;
    if (customPrompt && style === 'custom') {
      prompt = `Transform this photo with custom style: ${customPrompt}`;
    } else {
      prompt = `Transform this photo into ${styleConfig.prefix} style, ${styleConfig.suffix}. Make it look like a professional ${style} animation character portrait.`;
    }
    
    // Use our backend proxy to avoid CORS issues
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if user is logged in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use provided abort signal or create timeout controller
    let controller = null;
    let timeoutId = null;
    
    if (abortSignal) {
      // Use the provided abort signal
      if (abortSignal.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
    } else {
      // Create timeout controller if no abort signal provided
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
    }
    
    const finalSignal = abortSignal || controller.signal;
    
    const response = await fetch(getApiUrl('/flux/generate'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt,
        input_image: base64Only,
        style: style,
        model: model,
        aspectRatio: aspectRatio
      }),
      signal: finalSignal
    }).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    
    if (!response.ok) {
      // Handle cancelled requests
      if (response.status === 499) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.cancelled) {
          throw new DOMException('Request was cancelled', 'AbortError');
        }
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication required');
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.image) {
      // 📊 Track successful generation
      analytics.aiGenerationCompleted({
        model: model,
        style: style,
        generationTime: Date.now() - startTime,
        success: true,
        imagesCount: 1,
        creditsUsed: model === 'flux-pro' ? 10 : 5
      });

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
    // 📊 Track failed generation
    analytics.aiGenerationCompleted({
      model: model,
      style: style,
      generationTime: Date.now() - startTime,
      success: false,
      error: error.message,
      imagesCount: 0,
      creditsUsed: 0
    });

    console.error('Error generating with Flux:', error);
    throw error;
  }
}

/**
 * Generate anime-style image from uploaded photo
 * @param {string} imageUrl - URL or base64 of the uploaded image
 * @param {string} style - Selected anime style
 * @param {string} aiModel - AI model to use ('flux-pro', 'gpt-image', 'qwen-image', or 'nano-banana')
 * @param {string} aspectRatio - Aspect ratio for generation ('1:1', '16:9', etc.)
 * @param {AbortSignal} abortSignal - Signal to abort the request
 * @returns {Promise} Generated image data
 */
export async function generateAnimeImage(imageUrl, style = 'disney', aiModel = 'flux-pro', aspectRatio = '1:1', abortSignal = null, customPrompt = null) {
  // Use Flux for image-to-image generation
  if (aiModel === 'flux-pro') {
    return await generateWithFlux(imageUrl, style, aiModel, aspectRatio, abortSignal, customPrompt);
  }
  
  // Use Qwen Image for generation
  if (aiModel === 'qwen-image') {
    try {
      const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
      
      // Get auth token from store
      const token = useAuthStore.getState().token;
      
      // Upload image to FAL storage first
      let uploadedImageUrl;
      
      if (imageUrl.startsWith('http')) {
        // If it's already a URL, use it directly
        uploadedImageUrl = imageUrl;
      } else {
        // If it's base64, convert to blob and upload to FAL storage
        let base64Data = imageUrl;
        if (!imageUrl.startsWith('data:')) {
          base64Data = await urlToBase64(imageUrl);
        }
        
        // Convert base64 to blob without using fetch
        // Extract the base64 content and mime type
        const [header, base64Content] = base64Data.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        
        // Decode base64 to binary
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob from binary data
        const blob = new Blob([bytes], { type: mimeType });
        
        // Create a File object from blob
        const file = new File([blob], 'image.png', { type: mimeType });
        
        // Upload to FAL storage
        console.log('Uploading image to FAL storage...');
        uploadedImageUrl = await fal.storage.upload(file);
        console.log('Image uploaded to FAL:', uploadedImageUrl);
      }
      
      // Construct the prompt for Qwen Image
      let prompt;
      if (customPrompt && style === 'custom') {
        prompt = `Transform this photo with custom style: ${customPrompt}`;
      } else {
        prompt = `Transform this photo into ${styleConfig.prefix} style, ${styleConfig.suffix}, high quality, masterpiece`;
      }
      
      // Setup headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use our backend proxy for Qwen Image API with the uploaded URL
      const response = await fetch(getApiUrl('/qwen/edit'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: prompt,
          input_image: uploadedImageUrl,
          style: style,
          aspectRatio: aspectRatio,
          negativePrompt: 'blurry, ugly, low quality'
        }),
        signal: abortSignal
      });
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Authentication required');
        }
        
        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.images && result.images.length > 0) {
        return {
          images: result.images
        };
      }
      
      throw new Error(result.error || 'Failed to generate image');
    } catch (error) {
      console.error("Error generating with Qwen Image:", error);
      throw error;
    }
  }

  // Use GPT IMAGE for image-to-image generation
  if (aiModel === 'gpt-image') {
    try {
      const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
      
      // Get auth token from store
      const token = useAuthStore.getState().token;
      
      // Ensure image is in base64 format
      let base64Data = imageUrl;
      if (!imageUrl.startsWith('data:')) {
        base64Data = await urlToBase64(imageUrl);
      }
      
      // Remove data URL prefix if present
      const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Construct the prompt for GPT IMAGE
      let prompt;
      if (customPrompt && style === 'custom') {
        prompt = `Transform this photo with custom style: ${customPrompt}`;
      } else {
        prompt = `Transform this photo into ${styleConfig.prefix} anime style, ${styleConfig.suffix}, high quality anime portrait, masterpiece`;
      }
      
      // Setup headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use our backend proxy for GPT IMAGE API
      const response = await fetch(getApiUrl('/gptimage/generate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: prompt,
          input_image: base64Only,
          style: style,
          aspectRatio: aspectRatio
        })
      });
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Authentication required');
        }
        
        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
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

  // Use Nano-Banana for image-to-image generation
  if (aiModel === 'nano-banana') {
    try {
      const styleConfig = animeStylePrompts[style] || animeStylePrompts.disney;
      
      // Construct the prompt for Nano-Banana
      let prompt;
      if (customPrompt && style === 'custom') {
        prompt = `Transform this photo with custom style: ${customPrompt}`;
      } else {
        prompt = `Transform this photo into ${styleConfig.prefix} anime style, ${styleConfig.suffix}, high quality anime portrait, masterpiece`;
      }
      
      // Generate with Nano-Banana
      const result = await generateWithNanoBananaImageToImage(imageUrl, prompt, 'none', aspectRatio, abortSignal);
      
      return {
        images: [{
          url: result.url,
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      };
    } catch (error) {
      console.error("Error generating with Nano-Banana:", error);
      throw error;
    }
  }

  throw new Error(`Unsupported AI model: ${aiModel}`);
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