import React from 'react';
import { Download, Clock, Sparkles } from 'lucide-react';

const TextToImageUploader = ({ 
  generatedImage, 
  generationTime,
  isGenerating 
}) => {
  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
            <div className="relative">
              <Sparkles className="w-16 h-16 animate-pulse text-primary-500" />
              <div className="absolute inset-0 animate-spin">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Creating your image...</p>
              <p className="text-sm">This may take a moment</p>
            </div>
          </div>
        ) : generatedImage ? (
          <div className="relative w-full h-full">
            <img
              src={generatedImage}
              alt="Generated image"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute top-4 right-4">
              <button
                onClick={handleDownload}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all"
                title="Download image"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            {generationTime && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{generationTime}s</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 p-8">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
            <p className="text-sm">
              Enter your prompt and click generate to create an image
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextToImageUploader;