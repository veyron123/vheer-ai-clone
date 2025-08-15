import React from 'react';
import { Sparkles } from 'lucide-react';
import PricingDisplay from '../ui/PricingDisplay';

const GenerateButton = ({ onClick, disabled, isGenerating, aiModel = 'flux-pro' }) => {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled || isGenerating}
        className={`w-full py-3 rounded-lg font-medium transition-all ${
          !disabled && !isGenerating
            ? 'bg-yellow-400 text-black hover:bg-yellow-500'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Generating...
          </span>
        ) : (
          'Generate'
        )}
      </button>
      <PricingDisplay 
        modelId={aiModel} 
        className="mt-2" 
        showAffordability={true} 
      />
    </div>
  );
};

export default GenerateButton;