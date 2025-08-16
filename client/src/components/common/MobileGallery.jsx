import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Download, ZoomIn } from 'lucide-react';
import { downloadImageWithProxy, viewImage } from '../../utils/downloadUtils';

/**
 * Mobile-optimized image gallery with swipe support
 * Features:
 * - Touch/swipe navigation
 * - Pinch to zoom
 * - Full screen view
 * - Download functionality
 */
const MobileGallery = ({ 
  images = [], 
  initialIndex = 0,
  showThumbnails = true,
  showControls = true,
  onClose = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleDownload = () => {
    const currentImage = images[currentIndex];
    if (currentImage?.url) {
      downloadImageWithProxy(currentImage.url, currentImage.title || `image-${currentIndex + 1}.jpg`);
    }
  };

  const handleView = () => {
    const currentImage = images[currentIndex];
    if (currentImage?.url) {
      viewImage(currentImage.url);
    }
  };

  const swipeVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const swipeTransition = {
    x: { type: 'spring', stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No images to display</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Main Image Container */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={swipeTransition}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              
              if (swipe < -10000) {
                handleNext();
              } else if (swipe > 10000) {
                handlePrevious();
              }
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src={currentImage.url}
              alt={currentImage.title || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (hidden on mobile, swipe instead) */}
        {showControls && (
          <>
            <button
              onClick={handlePrevious}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Mobile Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleView}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors touch-manipulation"
            aria-label="View full size"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDownload}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors touch-manipulation"
            aria-label="Download image"
          >
            <Download className="w-5 h-5" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors touch-manipulation sm:hidden"
              aria-label="Close gallery"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Image Counter */}
        <div className="absolute top-2 left-2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`
                flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all touch-manipulation
                ${index === currentIndex 
                  ? 'border-primary-500 shadow-lg scale-105' 
                  : 'border-transparent opacity-70 hover:opacity-100'
                }
              `}
            >
              <img
                src={image.thumbnail || image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Title and Description */}
      {currentImage.title && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900">{currentImage.title}</h3>
          {currentImage.description && (
            <p className="text-sm text-gray-600 mt-1">{currentImage.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileGallery;