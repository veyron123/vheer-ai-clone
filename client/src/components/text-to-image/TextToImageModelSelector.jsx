import React from 'react';
import { TEXT_TO_IMAGE_MODELS } from '../../constants/textToImage.constants';

const TextToImageModelSelector = ({ selectedModel, onModelChange }) => {
  const selectedModelData = TEXT_TO_IMAGE_MODELS.find(model => model.id === selectedModel);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">AI Model</h3>
      <div className="grid grid-cols-2 gap-3">
        {TEXT_TO_IMAGE_MODELS.map((model) => (
          <button
            key={model.id}
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
              selectedModel === model.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
            }`}
            onClick={() => onModelChange(model.id)}
          >
            <div className="font-medium">{model.name}</div>
            
            {selectedModel === model.id && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
      {/* Price display under buttons */}
      <div className="text-center text-sm text-primary-600 font-medium">
        {selectedModelData?.credits} credits per generation
      </div>
    </div>
  );
};

export default TextToImageModelSelector;