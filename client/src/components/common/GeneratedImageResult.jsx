import React from 'react';
import { X, Download, ZoomIn, Clock, Loader2, Layers } from 'lucide-react';
import { downloadImageWithProxy, viewImage } from '../../utils/imageUtils';
import AutoMockupButton from './AutoMockupButton';

const GeneratedImageResult = ({
  generatedImage,
  isGenerating,
  generationTime,
  onCancel,
  onClear,
  aspectRatio,
  aiModel,
  autoShowMockup = true,
  title = "Generated Image",
  additionalActions = [],
  className = ""
}) => {
  const handleDownload = () => {
    if (generatedImage) {
      downloadImageWithProxy(generatedImage, 'ai-generated-image.png');
    }
  };

  const handleView = () => {
    if (generatedImage) {
      viewImage(generatedImage);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {generationTime && (
          <span className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {generationTime}s
          </span>
        )}
      </div>

      {generatedImage ? (
        <div>
          {/* Generated Image Display */}
          <div className="relative aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden mb-4">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-full object-contain"
            />
            
            {/* Image action buttons */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={handleView}
                className="bg-white text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
                title="Open in new tab"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Clear button */}
            {onClear && (
              <button
                onClick={onClear}
                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Additional Actions */}
          {additionalActions.length > 0 && (
            <div className="flex gap-2 mb-4">
              {additionalActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={action.className}
                  title={action.title}
                >
                  {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Auto Mockup Button */}
          <AutoMockupButton
            imageUrl={generatedImage}
            aspectRatio={aspectRatio}
            aiModel={aiModel}
            autoShow={autoShowMockup}
            className="w-full"
          />
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
                  Generating image...
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
                Generated image will appear here
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedImageResult;