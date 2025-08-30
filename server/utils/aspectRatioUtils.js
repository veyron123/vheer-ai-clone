/**
 * Universal aspect ratio utility functions
 * Based on GPT Image aspect ratio logic for consistency across all generators
 */

/**
 * Get standardized aspect ratio mapping based on GPT Image logic
 * This function provides a consistent aspect ratio conversion across all generators
 * @param {string} aspectRatio - Input aspect ratio 
 * @returns {string} Standardized aspect ratio
 */
export function getStandardizedAspectRatio(aspectRatio) {
  console.log(`🔍 Converting aspect ratio: "${aspectRatio}"`);
  
  const sizeMap = {
    // Standard ratios
    '1:1': '1:1',     // Square
    '3:2': '3:2',     // Landscape 
    '2:3': '2:3',     // Portrait
    '16:9': '16:9',   // Wide landscape - keep original for Flux
    '9:16': '9:16',   // Tall portrait - keep original for Flux
    '4:3': '4:3',     // Classic landscape - keep original for Flux
    '3:4': '3:4',     // Portrait format - keep original for Flux
    
    // Extended ratios for Flux (3:7 to 7:3 range) - keep as-is
    '7:3': '7:3',     // Ultra wide landscape
    '6:3': '6:3',     // Very wide landscape
    '5:3': '5:3',     // Wide landscape
    '5:2': '5:2',     // Cinematic landscape
    '7:4': '7:4',     // Wide landscape format
    '4:7': '4:7',     // Tall portrait format
    '3:5': '3:5',     // Tall portrait format
    '2:5': '2:5',     // Banner portrait
    '3:6': '3:6',     // Very tall portrait
    '3:7': '3:7',     // Ultra tall portrait
    
    // Alias formats
    'square': '1:1',
    'landscape': '3:2',
    'portrait': '2:3'
  };

  const result = sizeMap[aspectRatio] || aspectRatio; // Use original if not mapped
  console.log(`🔍 Mapped to standardized format: "${result}"`);
  
  return result;
}

/**
 * Convert standardized aspect ratio to service-specific format
 * @param {string} standardizedRatio - Standardized aspect ratio ('1:1', '3:2', '2:3')
 * @param {string} service - Service name ('flux', 'qwen', 'gpt-image', 'runway')
 * @returns {Object|string} Service-specific format
 */
export function convertToServiceFormat(standardizedRatio, service) {
  console.log(`🔄 Converting standardized ratio "${standardizedRatio}" for service: ${service}`);
  
  switch (service.toLowerCase()) {
    case 'flux':
      return convertToFluxDimensions(standardizedRatio);
    case 'qwen':
      return convertToQwenFormat(standardizedRatio);
    case 'gpt-image':
      return standardizedRatio; // GPT Image uses standardized format directly
    case 'nano-banana':
      return convertToNanoBananaDimensions(standardizedRatio);
    case 'runway':
      return convertToRunwayFormat(standardizedRatio);
    default:
      console.warn(`Unknown service: ${service}, returning standardized format`);
      return standardizedRatio;
  }
}

/**
 * Convert aspect ratio to Flux format (string-based aspect_ratio parameter)
 * Flux Kontext supports ratios from 3:7 (portrait) to 7:3 (landscape)
 * @param {string} aspectRatio - Aspect ratio
 * @returns {string} Flux aspect ratio string
 */
function convertToFluxDimensions(aspectRatio) {
  // Map all supported ratios to Flux format
  const fluxRatioMap = {
    // Standard ratios (all services)
    '1:1': '1:1',     // Square
    '3:2': '3:2',     // Standard landscape
    '2:3': '2:3',     // Standard portrait
    '16:9': '16:9',   // Wide landscape
    '9:16': '9:16',   // Tall portrait
    '4:3': '4:3',     // Classic landscape
    '3:4': '3:4',     // Classic portrait
    
    // Extended ratios for Flux (3:7 to 7:3 range)
    '7:3': '7:3',     // Ultra wide landscape (Flux max)
    '6:3': '6:3',     // Very wide landscape
    '5:3': '5:3',     // Wide landscape
    '5:2': '5:2',     // Cinematic landscape
    '7:4': '7:4',     // Wide landscape format
    '3:5': '3:5',     // Tall portrait format
    '2:5': '2:5',     // Banner portrait
    '3:6': '3:6',     // Very tall portrait
    '3:7': '3:7',     // Ultra tall portrait (Flux max)
    '4:7': '4:7',     // Tall portrait format
    
    // Alias formats
    'square': '1:1',
    'landscape': '3:2',
    'portrait': '2:3'
  };
  
  const result = fluxRatioMap[aspectRatio] || aspectRatio;
  console.log(`🔍 Flux aspect ratio for ${aspectRatio}: ${result}`);
  
  // Validate that the ratio is within Flux's supported range (3:7 to 7:3)
  if (!fluxRatioMap[aspectRatio]) {
    const [w, h] = aspectRatio.split(':').map(Number);
    if (w && h) {
      const ratio = w / h;
      const minRatio = 3 / 7; // 0.428
      const maxRatio = 7 / 3; // 2.333
      if (ratio < minRatio || ratio > maxRatio) {
        console.warn(`⚠️ Aspect ratio ${aspectRatio} is outside Flux range 3:7 to 7:3. Using default 1:1`);
        return '1:1';
      }
    }
  }
  
  return result;
}

/**
 * Convert standardized aspect ratio to Qwen format
 * @param {string} standardizedRatio - Standardized aspect ratio
 * @returns {string} Qwen format string
 */
function convertToQwenFormat(standardizedRatio) {
  const qwenFormatMap = {
    '1:1': 'square_hd',      // Square HD
    '3:4': 'portrait_4_3',   // Portrait format
    '4:3': 'landscape_4_3',  // Landscape format
    '16:9': 'landscape_16_9', // Wide landscape
    '9:16': 'portrait_9_16', // Tall portrait
    '3:2': 'landscape_4_3',  // Map to closest landscape format
    '2:3': 'portrait_4_3'    // Map to closest portrait format
  };

  const result = qwenFormatMap[standardizedRatio] || 'square_hd';
  console.log(`🔍 Qwen format for ${standardizedRatio}: "${result}"`);
  return result;
}

/**
 * Convert standardized aspect ratio to Nano-Banana dimensions
 * @param {string} standardizedRatio - Standardized aspect ratio
 * @returns {Object} Nano-Banana dimensions with width and height
 */
function convertToNanoBananaDimensions(standardizedRatio) {
  // Use same dimensions as Flux for consistency
  const nanoBananaDimensions = {
    '1:1': { width: 1024, height: 1024 },  // Square
    '3:2': { width: 1216, height: 832 },   // Landscape (closest to 3:2)
    '2:3': { width: 832, height: 1216 }    // Portrait (closest to 2:3)
  };

  const result = nanoBananaDimensions[standardizedRatio] || nanoBananaDimensions['1:1'];
  console.log(`🔍 Nano-Banana dimensions for ${standardizedRatio}:`, result);
  return result;
}

/**
 * Convert standardized aspect ratio to Runway format
 * @param {string} standardizedRatio - Standardized aspect ratio
 * @returns {string} Runway format string
 */
function convertToRunwayFormat(standardizedRatio) {
  const runwayFormatMap = {
    '1:1': '1:1',    // Square
    '3:2': '4:3',    // Closest supported landscape format
    '2:3': '3:4'     // Closest supported portrait format
  };

  const result = runwayFormatMap[standardizedRatio] || '1:1';
  console.log(`🔍 Runway format for ${standardizedRatio}: "${result}"`);
  return result;
}

/**
 * Get all supported aspect ratios with descriptions
 * @returns {Array} Array of aspect ratio objects with labels and descriptions
 */
export function getSupportedAspectRatios() {
  return [
    // Standard ratios (all services)
    { value: '1:1', label: 'Square (1:1)', description: 'Perfect square format', allModels: true },
    { value: '16:9', label: 'Widescreen (16:9)', description: 'Wide landscape format', allModels: true },
    { value: '9:16', label: 'Mobile (9:16)', description: 'Tall portrait format', allModels: true },
    { value: '4:3', label: 'Classic (4:3)', description: 'Classic photo format', allModels: true },
    { value: '3:4', label: 'Portrait (3:4)', description: 'Portrait photo format', allModels: true },
    { value: '3:2', label: 'Landscape (3:2)', description: 'Standard landscape format', allModels: true },
    { value: '2:3', label: 'Portrait (2:3)', description: 'Standard portrait format', allModels: true },
    
    // Extended ratios for Flux (3:7 to 7:3 range)
    { value: '7:3', label: 'Ultra Wide (7:3)', description: 'Ultra wide landscape', fluxOnly: true },
    { value: '6:3', label: 'Wide (6:3)', description: 'Very wide landscape', fluxOnly: true },
    { value: '5:3', label: 'Wide (5:3)', description: 'Wide landscape', fluxOnly: true },
    { value: '5:2', label: 'Cinematic (5:2)', description: 'Cinematic landscape', fluxOnly: true },
    { value: '7:4', label: 'Wide (7:4)', description: 'Wide landscape format', fluxOnly: true },
    { value: '3:5', label: 'Tall (3:5)', description: 'Tall portrait format', fluxOnly: true },
    { value: '2:5', label: 'Banner (2:5)', description: 'Tall banner format', fluxOnly: true },
    { value: '3:6', label: 'Tall (3:6)', description: 'Very tall portrait', fluxOnly: true },
    { value: '3:7', label: 'Ultra Tall (3:7)', description: 'Ultra tall portrait', fluxOnly: true },
    { value: '4:7', label: 'Tall (4:7)', description: 'Tall portrait format', fluxOnly: true },
    
    // Alias formats
    { value: 'square', label: 'Square', description: 'Square format alias' },
    { value: 'landscape', label: 'Landscape', description: 'Landscape format alias' },
    { value: 'portrait', label: 'Portrait', description: 'Portrait format alias' }
  ];
}

/**
 * Validate aspect ratio input
 * @param {string} aspectRatio - Aspect ratio to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidAspectRatio(aspectRatio) {
  const supportedRatios = getSupportedAspectRatios().map(ratio => ratio.value);
  return supportedRatios.includes(aspectRatio);
}