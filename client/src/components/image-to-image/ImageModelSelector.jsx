import React from 'react';
import { IMAGE_AI_MODELS } from '../../constants/image-to-image.constants';

const ImageModelSelector = ({ selectedModel, onModelChange }) => {
  const selectedModelData = Object.values(IMAGE_AI_MODELS).find(model => model.id === selectedModel);
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">AI Model</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(IMAGE_AI_MODELS).map((model) => (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-800">{model.name}</div>
            {model.badge && (
              <span 
                className={`absolute -top-3 -right-2 px-2 py-1 text-xs font-bold rounded-full ${model.badge.color}`}
              >
                {model.badge.text}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Price display under buttons */}
      {selectedModelData && (
        <div className="text-center text-sm text-primary-600 font-medium">
          {selectedModelData.credits} credits per generation
        </div>
      )}
    </div>
  );
};

export default ImageModelSelector;