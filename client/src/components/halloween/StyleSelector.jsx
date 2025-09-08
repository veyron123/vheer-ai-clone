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
        <span className="mr-2 text-2xl">🎃</span>
        Choose Your Curse
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
                analytics.aiStyleSelected(style.id, 'halloween');
              }}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                selectedStyle === style.id 
                  ? 'border-primary-500 shadow-md scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isPetPortrait ? 'hover:scale-105' : ''}`}
            >
              <img 
                src={style.image} 
                alt={`${style.name} Halloween style - Transform photos to ${style.name} style`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${isPetPortrait ? 'p-1' : 'p-0.5'}`}>
                <p className={`text-white leading-tight font-medium ${isPetPortrait ? 'text-[10px]' : 'text-[9px]'}`}>{style.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Style Input */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Or describe your own curse:</h4>
        <textarea
          value={customStyle}
          onChange={(e) => onCustomStyleChange(e.target.value)}
          placeholder="Describe the dark transformation you desire..."
          className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          maxLength={200}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {customStyle.length}/200 characters
        </div>
      </div>
    </>
  );
};

export default StyleSelector;