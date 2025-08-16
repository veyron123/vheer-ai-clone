import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Mobile-optimized modal component
 * Features:
 * - Full screen on mobile
 * - Swipe to dismiss
 * - Touch-optimized close button
 * - Prevents body scroll when open
 */
const MobileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  fullScreenOnMobile = true,
  showCloseButton = true,
  closeOnBackdrop = true
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      y: '100%'
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      y: '100%',
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { velocity, offset }) => {
              // Swipe down to close
              if (offset.y > 100 || velocity.y > 500) {
                onClose();
              }
            }}
            className={`
              fixed z-50 bg-white overflow-hidden
              ${fullScreenOnMobile 
                ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:rounded-2xl sm:max-h-[85vh]' 
                : 'inset-x-4 bottom-4 rounded-2xl max-h-[80vh] sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full'
              }
            `}
          >
            {/* Drag Handle (mobile only) */}
            {fullScreenOnMobile && (
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                {title && (
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileModal;