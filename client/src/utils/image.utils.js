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

// Detect aspect ratio from image - finds the closest available format
export const detectAspectRatio = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const actualRatio = img.width / img.height;
      
      // Available aspect ratios with their numeric values
      const availableRatios = [
        { id: '1:1', ratio: 1.0 },
        { id: '3:4', ratio: 3/4 }, // 0.75
        { id: '4:3', ratio: 4/3 }, // 1.333
        { id: '16:9', ratio: 16/9 }, // 1.778
        { id: '9:16', ratio: 9/16 } // 0.5625
      ];
      
      // Find the closest ratio by calculating distance
      let closestFormat = availableRatios[0];
      let minDistance = Math.abs(actualRatio - availableRatios[0].ratio);
      
      for (let i = 1; i < availableRatios.length; i++) {
        const distance = Math.abs(actualRatio - availableRatios[i].ratio);
        if (distance < minDistance) {
          minDistance = distance;
          closestFormat = availableRatios[i];
        }
      }
      
      console.log(`🎯 Image ratio: ${actualRatio.toFixed(3)} (${img.width}x${img.height}) → Closest format: ${closestFormat.id} (${closestFormat.ratio.toFixed(3)})`);
      resolve(closestFormat.id);
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