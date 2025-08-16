/**
 * Image utility functions following KISS principle
 * Centralized image processing utilities
 */

/**
 * Convert image URL to base64 string
 * Used across multiple services for image processing
 * @param {string} imageUrl - URL of the image to convert
 * @returns {Promise<string>} Base64 encoded image string
 */
export const urlToBase64 = async (imageUrl) => {
  // If already base64, return as is
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
};

/**
 * Convert file to base64 string
 * @param {File} file - File object to convert
 * @returns {Promise<string>} Base64 encoded file string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file type
 * @param {File} file - File to validate
 * @returns {boolean} True if valid image type
 */
export const isValidImageType = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  return validTypes.includes(file.type);
};

/**
 * Get image dimensions from URL
 * @param {string} url - Image URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
};