import React from 'react';
import { X, Download, ZoomIn, Clock, Loader2, Layers } from 'lucide-react';
import { downloadImageWithProxy, viewImage } from '../../utils/imageUtils';

const TextToImageResult = ({
  generatedImages,
  generatedImage,
  isGenerating,
  generationTime,
  onCancel,
  onClear,
  onUseAsBase,
  isBaseImageActive
}) => {
  // Поддерживаем как одиночные изображения, так и множественные
  const images = generatedImages || (generatedImage ? [generatedImage] : []);
  const handleDownload = () => {
    if (generatedImage) {
      downloadImageWithProxy(generatedImage, 'text-to-image.png');
    }
  };

  const handleView = () => {
    if (generatedImage) {
      viewImage(generatedImage);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Generated Image</h3>
        {generationTime && (
          <span className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {generationTime}s
          </span>
        )}
      </div>

      {images.length > 0 ? (
        <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
              <img 
                src={image.url || image} 
                alt={`Generated ${index + 1}`} 
                className="w-full h-full object-contain"
              />
              
              {/* Make changes button - только для первого изображения */}
              {index === 0 && onUseAsBase && (
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={() => onUseAsBase(image.url || image)}
                    className={`${
                      isBaseImageActive 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    } px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg flex items-center gap-2`}
                    title={isBaseImageActive ? "Base image active - Make more changes" : "Use this image as base for modifications"}
                  >
                    <Layers className="w-5 h-5" />
                    {isBaseImageActive ? 'Making changes' : 'Make changes'}
                  </button>
                </div>
              )}
              
              {/* Image action buttons */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={() => viewImage(image.url || image)}
                  className="bg-white text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
                  title="Open in new tab"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadImageWithProxy(image.url || image, `text-to-image-${index + 1}.png`)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Clear all images button - только на первом изображении */}
              {index === 0 && (
                <button
                  onClick={onClear}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove all images"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
          <div className="flex items-center justify-center h-full text-gray-400">
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="bg-white/90 rounded-full p-4 shadow-lg mb-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-center text-gray-600 mb-4">
                  Generating images...
                </p>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel Generation
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center">
                Generated images will appear here
              </p>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TextToImageResult;