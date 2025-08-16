import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LazyImage component for SEO-optimized image loading
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up effect with low-quality placeholder
 * - Proper alt text for SEO
 * - Loading states
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = null,
  srcSet = null
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    let observer;
    
    if (imageRef && !isLoaded) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting || entry.intersectionRatio > 0) {
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          { 
            threshold: 0.01,
            rootMargin: '50px'
          }
        );
        observer.observe(imageRef);
      } else {
        // Fallback for browsers that don't support IntersectionObserver
        setImageSrc(src);
      }
    }
    
    return () => {
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src, isLoaded]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setIsError(false);
    onLoad(e);
  };

  const handleError = (e) => {
    setIsError(true);
    setIsLoaded(true);
    onError(e);
  };

  // SEO-friendly noscript fallback
  const noscriptContent = `<img src="${src}" alt="${alt}" class="${className}" />`;

  return (
    <div className={`relative ${className}`}>
      {/* Main image */}
      <img
        ref={setImageRef}
        src={imageSrc || placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E'}
        alt={alt}
        className={`
          ${className}
          ${!isLoaded ? 'blur-sm' : 'blur-0'}
          transition-all duration-300
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        fetchpriority={fetchPriority}
        sizes={sizes}
        srcSet={srcSet}
        // SEO attributes
        itemProp="image"
        decoding="async"
      />
      
      {/* Loading state */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}
      
      {/* Noscript fallback for SEO */}
      <noscript dangerouslySetInnerHTML={{ __html: noscriptContent }} />
    </div>
  );
};

export default LazyImage;