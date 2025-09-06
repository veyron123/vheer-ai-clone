import React from 'react';
import { Info } from 'lucide-react';
import analytics from '../../services/analytics';

const StyleSelector = ({ 
  styles, 
  selectedStyle, 
  onStyleChange, 
  customStyle, 
  onCustomStyleChange,
  isPetPortrait = false
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        Choose Style
        <button className="ml-2 text-gray-400 hover:text-gray-600">
          <Info className="w-4 h-4" />
        </button>
      </h3>
      
      <div className="max-h-[320px] overflow-y-auto overflow-x-hidden mb-4">
        <div className={`grid ${isPetPortrait ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5`}>
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                onStyleChange(style.id);
                // 📊 Track style selection
                analytics.aiStyleSelected(style.id, 'anime');
              }}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                selectedStyle === style.id 
                  ? 'border-primary-500 shadow-md scale-[1.02]' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${isPetPortrait ? 'hover:scale-105' : ''}`}
            >
              <img 
                src={style.image} 
                alt={`${style.name} AI art style - Transform photos to ${style.name} style`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${isPetPortrait ? 'p-1' : 'p-0.5'}`}>
                <p className={`text-white leading-tight font-medium ${isPetPortrait ? 'text-[10px]' : 'text-[9px]'}`}>{style.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Style Section - Inside scrollable area */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-1.5">Your Custom Style</h4>
          <textarea
            value={customStyle || ''}
            onChange={(e) => onCustomStyleChange && onCustomStyleChange(e.target.value)}
            placeholder="Input more details information here"
            className="w-full px-2.5 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs"
            rows={2}
          />
        </div>
      </div>
    </>
  );
};

export default StyleSelector;