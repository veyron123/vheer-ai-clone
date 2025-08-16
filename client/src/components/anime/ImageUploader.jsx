import React, { useRef } from 'react';
import { Upload, Link2, X, Download, Loader2 } from 'lucide-react';

const ImageUploader = ({ 
  uploadedImage, 
  generatedImage, 
  generationTime,
  onImageUpload, 
  onImageRemove,
  onCancel,
  fileInputRef,
  isGenerating = false
}) => {
  const handleClick = () => {
    if (!uploadedImage && !generatedImage) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageUpload(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    
    // If generating, cancel the generation
    if (isGenerating && onCancel) {
      onCancel();
    }
    
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
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
          
          {/* Loading overlay with spinning ring */}
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
                Generated
              </div>
              
              {generationTime && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  ⏱️ {generationTime}s
                </div>
              )}
              
              <a
                href={generatedImage}
                download="anime-portrait.png"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-white text-black px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </>
          )}
          
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          {!generatedImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                
                // If generating, cancel the generation
                if (isGenerating && onCancel) {
                  onCancel();
                }
                
                fileInputRef.current?.click();
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
          <button className="bg-yellow-400 text-black font-medium px-6 py-3 rounded-lg mb-4 hover:bg-yellow-500 transition-colors inline-flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload your images
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">Or drop image here, paste image or URL</p>
          <p className="text-sm text-gray-400">jpeg, png, webp images allowed.</p>
        </>
      )}
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;