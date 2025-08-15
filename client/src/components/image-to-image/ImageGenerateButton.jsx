import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import PricingDisplay from '../ui/PricingDisplay';

const ImageGenerateButton = ({ onClick, disabled, isGenerating, onClear, aiModel = 'flux-pro' }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={onClick}
        disabled={disabled || isGenerating}
        className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate
          </>
        )}
      </button>
      
      <PricingDisplay 
        modelId={aiModel} 
        className="mt-1" 
        showAffordability={true} 
      />
      
      {onClear && (
        <button
          onClick={onClear}
          className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default ImageGenerateButton;