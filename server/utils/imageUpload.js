import axios from 'axios';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd5872cba0cfa53b44580045b14466f9c';

/**
 * Upload base64 image to imgbb hosting service
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} URL of uploaded image
 */
export const uploadToImgbb = async (base64Image) => {
  // Skip if already a URL
  if (base64Image.startsWith('http')) {
    return base64Image;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (response.data?.data?.url) {
      console.log('Image uploaded to:', response.data.data.url);
      return response.data.data.url;
    }
    
    throw new Error('Failed to upload image to hosting service');
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image for processing');
  }
};