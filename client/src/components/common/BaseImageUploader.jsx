import React, { useRef } from 'react';
import { Upload, Link2, X, Download, Loader2, ZoomIn, Clock } from 'lucide-react';
import { downloadImageWithProxy, viewImage } from '../../utils/imageUtils';

/**
 * Unified Image Uploader Component following KISS principle
 * Handles both single and grid layouts with minimal complexity
 */
const BaseImageUploader = ({ 
  // Core props
  uploadedImage, 
  generatedImage, 
  generationTime,
  isGenerating = false,
  
  // Event handlers
  onImageUpload, 
  onImageRemove,
  onCancel,
  onPaste,
  
  // Layout configuration
  layout = 'single', // 'single' or 'grid'
  showPasteSupport = false,
  
  // UI customization
  uploadText = 'Upload your images',
  dropText = 'Or drop image here, paste image or URL',
  allowedFormats = 'jpeg, png, webp images allowed.',
  generatedLabel = 'Generated',
  
  // File input ref
  fileInputRef
}) => {
  const localFileInputRef = useRef(null);
  const inputRef = fileInputRef || localFileInputRef;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (layout === 'grid') {
        // For grid layout, pass event-like object
        const fakeEvent = {
          target: { files: files }
        };
        onImageUpload(fakeEvent);
      } else {
        // For single layout, pass file directly
        onImageUpload(files[0]);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (layout === 'grid') {
        onImageUpload(e);
      } else {
        onImageUpload(file);
      }
    }
  };

  const handleClick = () => {
    if (!uploadedImage && !generatedImage) {
      inputRef.current?.click();
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const filename = layout === 'grid' ? 'generated-image.jpg' : 'anime-portrait.png';
      downloadImageWithProxy(generatedImage, filename);
    }
  };

  const handleView = () => {
    if (generatedImage) {
      viewImage(generatedImage);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (isGenerating && onCancel) {
      onCancel();
    }
    onImageRemove();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Setup paste listener for grid layout
  React.useEffect(() => {
    if (layout === 'grid' && onPaste) {
      const handlePasteShortcut = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          // Paste handling is done in the parent component
        }
      };
      
      document.addEventListener('paste', onPaste);
      document.addEventListener('keydown', handlePasteShortcut);
      
      return () => {
        document.removeEventListener('paste', onPaste);
        document.removeEventListener('keydown', handlePasteShortcut);
      };
    }
  }, [layout, onPaste]);

  // Grid layout render
  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Upload Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Original Image</h3>
          <div 
            className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-primary-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {uploadedImage ? (
              <>
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={onImageRemove}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                
                <label 
                  htmlFor="image-upload" 
                  className="btn btn-primary mb-4 cursor-pointer flex items-center gap-2 touch-manipulation"
                >
                  <Upload className="w-5 h-5" />
                  {uploadText}
                </label>
                
                <p className="text-gray-600 font-medium mb-2">
                  Drag & Drop your image(s) here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {allowedFormats}
                </p>
                
                {showPasteSupport && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      Support <kbd className="px-2 py-1 bg-white rounded border">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white rounded border">V</kbd> to paste image(s)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">{generatedLabel} Image</h3>
            {generationTime && (
              <span className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {typeof generationTime === 'number' ? generationTime.toFixed(1) : generationTime}s
              </span>
            )}
          </div>
          <div className="relative aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
            {generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleView}
                  className="absolute bottom-2 right-14 sm:bottom-3 sm:right-16 p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors shadow-lg border border-gray-200 touch-manipulation"
                  title="View Image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-lg touch-manipulation"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white/90 rounded-full p-4 shadow-lg mb-3">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                    <p className="text-center text-gray-600 mb-4">
                      Generating image...
                    </p>
                    {onCancel && (
                      <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-center">
                    {generatedLabel} image will appear here
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
      </div>
    );
  }

  // Single layout render (anime style)
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-8 text-center hover:border-primary-400 transition-colors cursor-pointer touch-manipulation"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      {uploadedImage || generatedImage ? (
        <div className="relative inline-block">
          <img 
            src={generatedImage || uploadedImage} 
            alt={generatedImage ? "Generated" : "Uploaded"} 
            className={`max-w-full max-h-96 rounded-lg mx-auto transition-all duration-300 ${
              isGenerating && !generatedImage ? 'blur-sm' : ''
            }`}
          />
          
          {isGenerating && !generatedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <div className="bg-white/90 rounded-full p-4 shadow-lg">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            </div>
          )}
          
          {generatedImage && (
            <>
              <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                {generatedLabel}
              </div>
              
              {generationTime && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  ⏱️ {generationTime}s
                </div>
              )}
              
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView();
                  }}
                  className="bg-white text-black p-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
                  title="View Image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="bg-white text-black p-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
          
          {!generatedImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isGenerating && onCancel) {
                  onCancel();
                }
                inputRef.current?.click();
              }}
              className="absolute bottom-2 left-2 bg-white text-black px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Upload className="w-4 h-4" />
              Change Image
            </button>
          )}
        </div>
      ) : (
        <>
          <button className="bg-yellow-400 text-black font-medium px-4 sm:px-6 py-3 rounded-lg mb-4 hover:bg-yellow-500 transition-colors inline-flex items-center touch-manipulation">
            <Upload className="w-5 h-5 mr-2" />
            {uploadText}
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">{dropText}</p>
          <p className="text-sm text-gray-400">{allowedFormats}</p>
        </>
      )}
      
      
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default BaseImageUploader;