/**
 * Utility for detecting browser support for modern image formats
 */

/**
 * Check if browser supports AVIF format
 * @returns {Promise<boolean>}
 */
export const supportsAvif = () => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = () => resolve(true);
    webP.onerror = () => resolve(false);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Detect best supported image format
 * @returns {Promise<string>} 'avif' | 'webp' | 'auto'
 */
export const detectBestImageFormat = async () => {
  // Check for AVIF support first (best compression)
  const hasAvif = await supportsAvif();
  if (hasAvif) {
    return 'avif';
  }
  
  // Check for WebP support (good compression)
  const hasWebP = await supportsWebP();
  if (hasWebP) {
    return 'webp';
  }
  
  // Fallback to auto (original format)
  return 'auto';
};

/**
 * Get Cloudinary format parameter based on browser support
 * @returns {Promise<string>}
 */
export const getCloudinaryFormat = async () => {
  const format = await detectBestImageFormat();
  return `f_${format}`;
};

/**
 * Generate optimized Cloudinary URL with best format
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {Promise<string>}
 */
export const optimizeCloudinaryUrl = async (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  const format = await getCloudinaryFormat();
  const baseUrl = url.split('/upload/')[0] + '/upload/';
  const imagePath = url.split('/upload/')[1];
  
  const transformations = [
    format,
    options.width && `w_${options.width}`,
    options.height && `h_${options.height}`,
    options.quality !== undefined ? `q_${options.quality}` : 'q_auto',
    options.blur && `e_blur:${options.blur}`,
    'c_limit', // Ensure image doesn't exceed specified dimensions
    'dpr_auto' // Auto device pixel ratio
  ].filter(Boolean).join(',');
  
  return `${baseUrl}${transformations}/${imagePath}`;
};

/**
 * Preload image with optimal format
 * @param {string} src - Image source URL
 * @returns {Promise<void>}
 */
export const preloadImage = async (src) => {
  const optimizedSrc = await optimizeCloudinaryUrl(src);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = optimizedSrc;
  });
};

/**
 * Browser capability detection
 */
export const browserCapabilities = {
  avif: false,
  webp: false,
  lazy: 'loading' in HTMLImageElement.prototype,
  intersection: 'IntersectionObserver' in window,
  picture: 'HTMLPictureElement' in window,
};

// Initialize capabilities on load
if (typeof window !== 'undefined') {
  supportsAvif().then(result => browserCapabilities.avif = result);
  supportsWebP().then(result => browserCapabilities.webp = result);
}

export default {
  supportsAvif,
  supportsWebP,
  detectBestImageFormat,
  getCloudinaryFormat,
  optimizeCloudinaryUrl,
  preloadImage,
  browserCapabilities
};