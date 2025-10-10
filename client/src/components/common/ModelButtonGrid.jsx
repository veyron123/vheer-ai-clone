import React from 'react';

/**
 * Unified button grid for selecting AI models across generators.
 * Uses the styling pattern from the image-to-image generator.
 */
const ModelButtonGrid = ({
  models = [],
  selectedModel,
  onModelChange,
  title,
  description,
  gridClassName = 'grid grid-cols-2 gap-2',
  className = '',
  showCredits = true
}) => {
  const modelArray = Array.isArray(models) ? models : Object.values(models);
  const selectedModelData = modelArray.find(model => model.id === selectedModel);

  return (
    <div className={`space-y-3 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className={gridClassName}>
        {modelArray.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onModelChange && onModelChange(model.id)}
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all text-left ${
              selectedModel === model.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{model.name}</div>
          </button>
        ))}
      </div>

      {showCredits && selectedModelData?.credits != null && (
        <div className="text-center text-sm text-primary-600 font-medium">
          {selectedModelData.credits} credits per generation
        </div>
      )}
    </div>
  );
};

export default ModelButtonGrid;
