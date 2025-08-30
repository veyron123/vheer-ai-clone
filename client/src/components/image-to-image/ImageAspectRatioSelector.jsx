import React from 'react';
import { IMAGE_ASPECT_RATIOS } from '../../constants/image-to-image.constants';

const ImageAspectRatioSelector = ({ selectedRatio, onRatioChange, disabled }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Aspect Ratio</h3>
      <select
        value={selectedRatio}
        onChange={(e) => onRatioChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
      >
        {IMAGE_ASPECT_RATIOS.map((ratio) => (
          <option key={ratio.id} value={ratio.id}>
            {ratio.name} - {ratio.description}
          </option>
        ))}
      </select>
      {disabled && (
        <p className="text-xs text-gray-500">
          Aspect ratio selection is available for all models except Nano-Banana (which always generates 1024x1024)
        </p>
      )}
    </div>
  );
};

export default ImageAspectRatioSelector;