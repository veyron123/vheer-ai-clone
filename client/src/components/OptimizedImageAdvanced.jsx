import React, { useState, useEffect, useRef } from 'react';
import { browserCapabilities, optimizeCloudinaryUrl } from '../utils/imageFormatDetection';

/**
 * Advanced OptimizedImage component with automatic format detection
 * Features:
 * - Automatic AVIF/WebP/JPG selection based on browser support
 * - Lazy loading with Intersection Observer
 * - Progressive image loading
 * - Responsive image sizing
 * - Automatic quality optimization
 */
const OptimizedImageAdvanced = ({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  loading = 'lazy',
  sizes = '100vw',
  quality = 'auto',
  placeholder = 'blur',
  priority = false,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [optimizedUrls, setOptimizedUrls] = useState({});
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate optimized URLs for different formats
  useEffect(() => {
    const generateOptimizedUrls = async () => {
      if (!src) return;
      
      if (src.includes('cloudinary.com')) {
        const baseUrl = src.split('/upload/')[0] + '/upload/';
        const imagePath = src.split('/upload/')[1];
        
        // Generate URLs for different sizes and formats
        const sizes = [320, 640, 1024, 1920];
        const formats = [];
        
        // Add formats based on browser support
        if (browserCapabilities.avif) formats.push('avif');
        if (browserCapabilities.webp) formats.push('webp');
        formats.push('auto'); // Always include original format as fallback
        
        const urls = {};
        
        for (const format of formats) {
          urls[format] = sizes.map(size => {
            const q = quality === 'auto' ? 'q_auto' : `q_${quality}`;
            return `${baseUrl}w_${size},${q},f_${format},c_limit,dpr_auto/${imagePath} ${size}w`;
          }).join(', ');
        }
        
        // Generate blur placeholder
        urls.placeholder = `${baseUrl}w_40,q_10,e_blur:1000,f_auto/${imagePath}`;
        
        setOptimizedUrls(urls);
        
        // Set initial placeholder
        if (placeholder === 'blur') {
          setImageSrc(urls.placeholder);
        }
      } else {
        // Non-Cloudinary image
        setOptimizedUrls({ original: src });
      }
    };
    
    generateOptimizedUrls();
  }, [src, quality, placeholder]);

  // Setup lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      loadImage();
      return;
    }

    if (!browserCapabilities.intersection) {
      // Fallback for browsers without Intersection Observer
      loadImage();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observerRef.current && entry.target) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, loading, priority, optimizedUrls]);

  const loadImage = async () => {
    if (!src) return;
    
    try {
      // Preload the image
      const img = new Image();
      
      if (src.includes('cloudinary.com')) {
        // Use the best available format
        const format = browserCapabilities.avif ? 'avif' : 
                       browserCapabilities.webp ? 'webp' : 'auto';
        
        const baseUrl = src.split('/upload/')[0] + '/upload/';
        const imagePath = src.split('/upload/')[1];
        const q = quality === 'auto' ? 'q_auto' : `q_${quality}`;
        
        img.src = `${baseUrl}${q},f_${format},c_limit,dpr_auto/${imagePath}`;
      } else {
        img.src = src;
      }
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      setImageSrc(img.src);
      setImageLoaded(true);
      onLoad();
    } catch (err) {
      setError(true);
      onError(err);
    }
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
      aria-label="Loading image..."
    />
  );

  // Error state
  const renderError = () => (
    <div 
      className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
      role="img"
      aria-label={`Failed to load image: ${alt}`}
    >
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  if (error) {
    return renderError();
  }

  if (!imageLoaded && !imageSrc) {
    return renderSkeleton();
  }

  // For Cloudinary images, use picture element with multiple sources
  if (src?.includes('cloudinary.com') && Object.keys(optimizedUrls).length > 0) {
    return (
      <picture ref={imgRef}>
        {/* AVIF format - best compression */}
        {optimizedUrls.avif && (
          <source
            type="image/avif"
            srcSet={optimizedUrls.avif}
            sizes={sizes}
          />
        )}
        
        {/* WebP format - good compression */}
        {optimizedUrls.webp && (
          <source
            type="image/webp"
            srcSet={optimizedUrls.webp}
            sizes={sizes}
          />
        )}
        
        {/* Fallback to original format */}
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${!imageLoaded ? 'blur-sm' : ''} transition-all duration-300`}
          width={width}
          height={height}
          srcSet={optimizedUrls.auto}
          sizes={sizes}
          loading={priority ? 'eager' : loading}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setImageLoaded(true)}
          {...props}
        />
      </picture>
    );
  }

  // For non-Cloudinary images
  return (
    <img
      ref={imgRef}
      src={imageSrc || src}
      alt={alt}
      className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading={priority ? 'eager' : loading}
      decoding={priority ? 'sync' : 'async'}
      onLoad={() => {
        setImageLoaded(true);
        onLoad();
      }}
      onError={() => {
        setError(true);
        onError();
      }}
      {...props}
    />
  );
};

// Hook for preloading critical images
export const useImagePreload = (images) => {
  useEffect(() => {
    if (!images || images.length === 0) return;
    
    const preloadImages = async () => {
      const promises = images.map(async (src) => {
        if (src?.includes('cloudinary.com')) {
          const optimized = await optimizeCloudinaryUrl(src, { quality: 85 });
          const img = new Image();
          img.src = optimized;
        } else {
          const img = new Image();
          img.src = src;
        }
      });
      
      await Promise.all(promises);
    };
    
    preloadImages();
  }, [images]);
};

export default OptimizedImageAdvanced;