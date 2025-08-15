import React from 'react';
import { IMAGE_AI_MODELS } from '../../constants/image-to-image.constants';

const ImageModelSelector = ({ selectedModel, onModelChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">AI Model</h3>
      <div className="space-y-2">
        {Object.values(IMAGE_AI_MODELS).map((model) => (
          <label
            key={model.id}
            className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="ai-model"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={(e) => onModelChange(e.target.value)}
                className="sr-only"
              />
              <span className="font-medium text-gray-800">{model.name}</span>
            </div>
            {model.badge && (
              <span 
                className={`px-2 py-1 text-xs font-bold rounded-full ${model.badge.color}`}
              >
                {model.badge.text}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ImageModelSelector;