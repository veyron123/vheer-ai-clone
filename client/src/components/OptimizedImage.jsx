import React, { useState, useEffect, useRef } from 'react';

/**
 * OptimizedImage component with lazy loading and progressive enhancement
 * Features:
 * - Lazy loading with Intersection Observer
 * - Progressive image loading (low quality → high quality)
 * - Responsive image sizing
 * - WebP format support with fallback
 * - Loading skeleton
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  loading = 'lazy',
  sizes = '100vw',
  placeholder = 'blur',
  blurDataURL = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(blurDataURL || '');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (loading === 'eager') {
      loadImage();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const loadImage = () => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      onLoad();
    };
    
    img.onerror = () => {
      setError(true);
      onError();
    };
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!src) return '';
    
    // If it's a Cloudinary URL, add responsive transformations
    if (src.includes('cloudinary.com')) {
      const baseUrl = src.split('/upload/')[0] + '/upload/';
      const imagePath = src.split('/upload/')[1];
      
      return `
        ${baseUrl}w_320,q_auto,f_auto/${imagePath} 320w,
        ${baseUrl}w_640,q_auto,f_auto/${imagePath} 640w,
        ${baseUrl}w_1024,q_auto,f_auto/${imagePath} 1024w,
        ${baseUrl}w_1920,q_auto,f_auto/${imagePath} 1920w
      `.trim();
    }
    
    return '';
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div 
      className={`bg-gray-200 animate-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    />
  );

  // Error state
  const renderError = () => (
    <div 
      className={`bg-gray-100 flex items-center justify-center ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  if (error) {
    return renderError();
  }

  if (!imageLoaded && !blurDataURL) {
    return renderSkeleton();
  }

  const srcSet = generateSrcSet();

  return (
    <picture ref={imgRef}>
      {/* AVIF format for newest browsers (best compression) */}
      {src && src.includes('cloudinary.com') && (
        <source
          type="image/avif"
          srcSet={srcSet.replace(/f_auto/g, 'f_avif')}
          sizes={sizes}
        />
      )}
      
      {/* WebP format for modern browsers (good compression) */}
      {src && src.includes('cloudinary.com') && (
        <source
          type="image/webp"
          srcSet={srcSet.replace(/f_auto/g, 'f_webp')}
          sizes={sizes}
        />
      )}
      
      {/* Original format fallback (JPG/PNG) */}
      <img
        src={imageSrc || blurDataURL}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'blur-sm' : ''} transition-all duration-300`}
        width={width}
        height={height}
        srcSet={srcSet}
        sizes={sizes}
        loading={loading}
        onLoad={() => setImageLoaded(true)}
        {...props}
      />
    </picture>
  );
};

// HOC for adding blur placeholder from Cloudinary
export const withCloudinaryBlur = (src) => {
  if (!src || !src.includes('cloudinary.com')) return null;
  
  const baseUrl = src.split('/upload/')[0] + '/upload/';
  const imagePath = src.split('/upload/')[1];
  
  // Generate a low-quality blur placeholder with AVIF if supported
  const supportsAvif = typeof window !== 'undefined' && 
    window.navigator?.userAgent?.includes('Chrome') && 
    parseInt(window.navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 0) >= 85;
  
  const format = supportsAvif ? 'f_avif' : 'f_auto';
  
  // Low quality blur placeholder
  return `${baseUrl}w_40,q_10,e_blur:1000,${format}/${imagePath}`;
};

export default OptimizedImage;