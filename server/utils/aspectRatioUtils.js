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
    '1:1': '1:1',     // Square
    '3:2': '3:2',     // Landscape 
    '2:3': '2:3',     // Portrait
    '16:9': '3:2',    // Map 16:9 to closest supported (3:2)
    '9:16': '2:3',    // Map 9:16 to closest supported (2:3)
    '4:3': '3:2',     // Map 4:3 to closest supported (3:2)
    '3:4': '2:3',     // Map 3:4 to closest supported (2:3)
    'square': '1:1',
    'landscape': '3:2',
    'portrait': '2:3'
  };

  const result = sizeMap[aspectRatio] || '1:1';
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
    case 'runway':
      return convertToRunwayFormat(standardizedRatio);
    default:
      console.warn(`Unknown service: ${service}, returning standardized format`);
      return standardizedRatio;
  }
}

/**
 * Convert standardized aspect ratio to Flux dimensions
 * @param {string} standardizedRatio - Standardized aspect ratio
 * @returns {Object} Flux dimensions with width and height
 */
function convertToFluxDimensions(standardizedRatio) {
  const fluxDimensions = {
    '1:1': { width: 1024, height: 1024 },  // Square
    '3:2': { width: 1216, height: 832 },   // Landscape (closest to 3:2)
    '2:3': { width: 832, height: 1216 }    // Portrait (closest to 2:3)
  };

  const result = fluxDimensions[standardizedRatio] || fluxDimensions['1:1'];
  console.log(`🔍 Flux dimensions for ${standardizedRatio}:`, result);
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
    '3:2': 'landscape_4_3',  // Closest landscape format to 3:2
    '2:3': 'portrait_4_3'    // Closest portrait format to 2:3
  };

  const result = qwenFormatMap[standardizedRatio] || 'square_hd';
  console.log(`🔍 Qwen format for ${standardizedRatio}: "${result}"`);
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
    { value: '1:1', label: 'Square (1:1)', description: 'Perfect square format' },
    { value: '3:2', label: 'Landscape (3:2)', description: 'Standard landscape format' },
    { value: '2:3', label: 'Portrait (2:3)', description: 'Standard portrait format' },
    { value: '16:9', label: 'Widescreen (16:9)', description: 'Maps to 3:2 landscape' },
    { value: '9:16', label: 'Mobile (9:16)', description: 'Maps to 2:3 portrait' },
    { value: '4:3', label: 'Classic (4:3)', description: 'Maps to 3:2 landscape' },
    { value: '3:4', label: 'Portrait (3:4)', description: 'Maps to 2:3 portrait' },
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