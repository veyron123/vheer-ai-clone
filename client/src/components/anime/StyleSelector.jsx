import React from 'react';
import { Info } from 'lucide-react';

const StyleSelector = ({ 
  styles, 
  selectedStyle, 
  onStyleChange, 
  customStyle, 
  onCustomStyleChange 
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        Choose Style
        <button className="ml-2 text-gray-400 hover:text-gray-600">
          <Info className="w-4 h-4" />
        </button>
      </h3>
      
      <div className="grid grid-cols-4 gap-2 mb-6 max-h-[400px] overflow-y-auto">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedStyle === style.id 
                ? 'border-primary-500 shadow-lg scale-105' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img 
              src={style.image} 
              alt={`${style.name} AI art style - Transform photos to ${style.name} style`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
              <p className="text-white text-[10px] leading-tight">{style.name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Style Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Your Custom Style</h4>
        <textarea
          value={customStyle || ''}
          onChange={(e) => onCustomStyleChange && onCustomStyleChange(e.target.value)}
          placeholder="Input more details information here"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          rows={3}
        />
      </div>
    </>
  );
};

export default StyleSelector;