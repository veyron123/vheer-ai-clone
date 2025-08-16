import React from 'react';
import { Upload, X, Download, Clock, Clipboard, Loader2 } from 'lucide-react';

const ImageToImageUploader = ({
  uploadedImage,
  generatedImage,
  generationTime,
  onImageUpload,
  onImageRemove,
  onCancel,
  onPaste,
  fileInputRef,
  isGenerating = false
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const fakeEvent = {
        target: {
          files: files
        }
      };
      onImageUpload(fakeEvent);
    }
  };

  const handlePasteShortcut = (e) => {
    // Check for Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Paste handling is done in the parent component
    }
  };

  React.useEffect(() => {
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', handlePasteShortcut);
    
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('keydown', handlePasteShortcut);
    };
  }, [onPaste]);

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'generated-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
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
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
                id="image-upload"
              />
              
              <label 
                htmlFor="image-upload" 
                className="btn btn-primary mb-4 cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload your images
              </label>
              
              <p className="text-gray-600 font-medium mb-2">
                Drag & Drop your image(s) here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                jpeg, png, webp images allowed.
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  Support <kbd className="px-2 py-1 bg-white rounded border">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white rounded border">V</kbd> to paste image(s)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Generated Image</h3>
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
                onClick={downloadImage}
                className="absolute bottom-3 right-3 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-lg"
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
                  Generated image will appear here
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToImageUploader;