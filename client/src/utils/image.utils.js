/**
 * Image utilities for processing and aspect ratio detection
 */

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Detect aspect ratio from image
export const detectAspectRatio = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      
      // Match to closest standard ratio
      if (Math.abs(ratio - 1) < 0.1) resolve('1:1');
      else if (Math.abs(ratio - 16/9) < 0.1) resolve('16:9');
      else if (Math.abs(ratio - 9/16) < 0.1) resolve('9:16');
      else if (Math.abs(ratio - 4/3) < 0.1) resolve('4:3');
      else if (Math.abs(ratio - 3/4) < 0.1) resolve('3:4');
      else if (ratio > 1.3) resolve('16:9'); // Wide images
      else if (ratio < 0.8) resolve('9:16'); // Tall images
      else resolve('1:1'); // Default
    };
    img.src = imageDataUrl;
  });
};

// Handle file selection
export const handleFileSelection = async (file, setUploadedImage) => {
  if (!file || !file.type.startsWith('image/')) return false;
  
  try {
    const base64 = await fileToBase64(file);
    setUploadedImage(base64);
    return true;
  } catch (error) {
    console.error('File selection error:', error);
    return false;
  }
};