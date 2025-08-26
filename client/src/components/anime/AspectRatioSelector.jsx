import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ASPECT_RATIOS } from '../../constants/anime.constants';

const AspectRatioSelector = ({ selectedRatio, onRatioChange, disabled = false, aiModel }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close dropdown when disabled changes
  useEffect(() => {
    if (disabled) setShowDropdown(false);
  }, [disabled]);
  
  // Filter options based on selected AI model
  const availableOptions = aiModel === 'gpt-image' 
    ? ASPECT_RATIOS 
    : ASPECT_RATIOS.filter(opt => opt.id !== 'match');
  
  // If current selection is not available, switch to first available option
  useEffect(() => {
    if (selectedRatio === 'match' && aiModel !== 'gpt-image') {
      onRatioChange('1:1');
    }
  }, [aiModel, selectedRatio, onRatioChange]);
  
  const currentOption = availableOptions.find(opt => opt.id === selectedRatio) || availableOptions[0];
  
  return (
    <div className="mb-6 relative" ref={dropdownRef}>
      <label className="text-sm font-medium mb-3 block">
        Aspect Ratio
      </label>
      
      <button 
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-left rounded-lg border transition-colors flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-50 border-gray-200 hover:border-gray-300 cursor-pointer'
        }`}
      >
        <div>
          <span className="text-sm">{currentOption.name}</span>
          <span className="text-xs text-gray-500 ml-1">
            ({currentOption.description})
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
          showDropdown && !disabled ? 'rotate-180' : ''
        }`} />
      </button>
      
      {showDropdown && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {availableOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onRatioChange(option.id);
                setShowDropdown(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedRatio === option.id ? 'bg-primary-50 text-primary-700' : ''
              }`}
            >
              <div className="text-sm font-medium">{option.name}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AspectRatioSelector;