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
    // Fallback: use viewImage function which handles data URLs properly
    await viewImage(imageUrl);
  }
};

/**
 * Open image in new tab/window
 * @param {string} imageUrl - URL of the image to view
 */
export const viewImage = async (imageUrl) => {
  try {
    let viewUrl = imageUrl;
    
    // For data URLs, convert to blob URL to avoid browser restrictions
    if (imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      viewUrl = URL.createObjectURL(blob);
    }
    
    // Open in new tab
    const newWindow = window.open(viewUrl, '_blank');
    
    // Clean up blob URL after a short delay to allow the window to load
    if (viewUrl !== imageUrl) {
      setTimeout(() => {
        URL.revokeObjectURL(viewUrl);
      }, 1000);
    }
    
    // If window.open failed (popup blocked), fall back to creating a modal or alert
    if (!newWindow) {
      console.warn('Popup blocked, creating temporary viewing solution');
      // Create a temporary modal for viewing the image
      createImageViewModal(imageUrl);
    }
  } catch (error) {
    console.error('Error viewing image:', error);
    // Last fallback: try direct open anyway
    window.open(imageUrl, '_blank');
  }
};

/**
 * Create a modal for viewing images when popup is blocked
 * @param {string} imageUrl - URL of the image to view in modal
 */
const createImageViewModal = (imageUrl) => {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;
  
  // Create image element
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  `;
  
  // Create close text
  const closeText = document.createElement('div');
  closeText.textContent = 'Click anywhere to close';
  closeText.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    background: rgba(0, 0, 0, 0.7);
    padding: 8px 12px;
    border-radius: 4px;
  `;
  
  // Add elements to overlay
  overlay.appendChild(img);
  overlay.appendChild(closeText);
  
  // Add close functionality
  overlay.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // Prevent closing when clicking on image
  img.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Add to page
  document.body.appendChild(overlay);
};