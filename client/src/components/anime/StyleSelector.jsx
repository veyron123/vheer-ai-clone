import React from 'react';
import { Info } from 'lucide-react';

const StyleSelector = ({ styles, selectedStyle, onStyleChange }) => {
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
              alt={style.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
              <p className="text-white text-[10px] leading-tight">{style.name}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default StyleSelector;