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

/**
 * Download image with proxy handling
 * @param {string} imageUrl - URL of the image to download
 * @param {string} filename - Name for the downloaded file
 */
export const downloadImageWithProxy = async (imageUrl, filename = 'image.png') => {
  try {
    let downloadUrl = imageUrl;
    
    // For data URLs, create blob and download directly
    if (imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      downloadUrl = URL.createObjectURL(blob);
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL if created
    if (downloadUrl !== imageUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error('Error downloading image:', error);
    // Fallback: open in new tab
    window.open(imageUrl, '_blank');
  }
};

/**
 * Open image in new tab/window
 * @param {string} imageUrl - URL of the image to view
 */
export const viewImage = (imageUrl) => {
  window.open(imageUrl, '_blank');
};