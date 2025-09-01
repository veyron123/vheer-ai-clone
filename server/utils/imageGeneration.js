import { createCanvas } from 'canvas';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';

/**
 * Create a placeholder image with text
 * @param {string} prompt - Original prompt
 * @param {string} description - Enhanced description
 * @returns {Promise<{url: string}>}
 */
export async function createPlaceholderImage(prompt, description) {
  try {
    // Create a canvas for the placeholder image
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add some decorative circles
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * 1024,
        Math.random() * 1024,
        Math.random() * 200 + 50,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text
    const words = prompt.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 900 && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    
    // Draw wrapped text
    const lineHeight = 60;
    const startY = 512 - (lines.length * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 512, startY + index * lineHeight);
    });
    
    // Add description preview at bottom
    ctx.font = '24px Arial';
    ctx.globalAlpha = 0.7;
    const descPreview = description.slice(0, 100) + '...';
    ctx.fillText(descPreview, 512, 900);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Upload to Cloudinary using the v2 API
    const cloudinaryV2 = cloudinary.v2;
    
    // Configure Cloudinary if not already configured
    if (!cloudinaryV2.config().cloud_name) {
      cloudinaryV2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          folder: 'generated/nano-banana',
          public_id: `placeholder_${uuidv4()}`,
          format: 'png',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({ url: result.secure_url });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error creating placeholder image:', error);
    // Return a simple placeholder URL as fallback
    return {
      url: `https://via.placeholder.com/1024x1024/667eea/ffffff?text=${encodeURIComponent(prompt.slice(0, 50))}`
    };
  }
}

/**
 * Create an image from a text prompt using available services
 * @param {string} prompt - Text prompt for image generation
 * @returns {Promise<{url: string}>}
 */
export async function createImageFromPrompt(prompt) {
  // This is a placeholder for future integration with actual image generation services
  // For now, create a styled placeholder
  return createPlaceholderImage(prompt, prompt);
}

/**
 * Save generated image from base64
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} model - Model that generated the image
 * @returns {Promise<{url: string}>}
 */
export async function saveGeneratedImageFromBase64(base64Data, model) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload to Cloudinary using the v2 API
    const cloudinaryV2 = cloudinary.v2;
    
    // Configure Cloudinary if not already configured
    if (!cloudinaryV2.config().cloud_name) {
      cloudinaryV2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          folder: `generated/${model}`,
          public_id: `${model}_${uuidv4()}`,
          format: 'png',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({ url: result.secure_url });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error saving generated image:', error);
    throw error;
  }
}