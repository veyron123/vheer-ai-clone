import React from 'react';
import { AI_MODELS } from '../../constants/anime.constants';

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const models = Object.values(AI_MODELS);
  const selectedModelData = models.find(model => model.id === selectedModel);
  
  return (
    <div className="mb-6">
      <label className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Model</span>
      </label>
      
      <div className="grid grid-cols-2 gap-2">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
              selectedModel === model.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {model.name}
            <span className={`absolute -top-3 -right-2 ${model.badge.color} text-sm px-2 py-0.5 rounded-full font-bold`}>
              {model.badge.text}
            </span>
          </button>
        ))}
      </div>
      
      {/* Price display under buttons */}
      {selectedModelData && (
        <div className="text-center text-sm text-primary-600 font-medium mt-3">
          {selectedModelData.credits} credits per generation
        </div>
      )}
    </div>
  );
};

export default ModelSelector;