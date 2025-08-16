import React, { useState } from 'react';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import PricingDisplay from '../ui/PricingDisplay';
import AuthRequiredModal from '../ui/AuthRequiredModal';

const ImageGenerateButton = ({ onClick, disabled, isGenerating, onClear, aiModel = 'flux-pro' }) => {
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    onClick();
  };

  // For authenticated users: disable if disabled or generating
  // For unauthenticated users: never disable (always allow clicking for auth modal)
  const isButtonDisabled = isAuthenticated ? (disabled || isGenerating) : false;
  
  // Button should be active if not disabled and not generating, OR if user is not authenticated
  const isButtonActive = (!disabled && !isGenerating) || !isAuthenticated;

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
          isButtonActive
            ? 'bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : !isAuthenticated ? (
          <>
            <Lock className="w-5 h-5" />
            Sign In to Generate
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate
          </>
        )}
      </button>
      
      {isAuthenticated && (
        <PricingDisplay 
          modelId={aiModel} 
          className="mt-1" 
          showAffordability={true} 
        />
      )}
      
      {!isAuthenticated && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Sign in to start generating amazing AI images
          </p>
          <p className="text-xs text-yellow-600 font-medium">
            ⭐ Get 100 free generations on signup!
          </p>
        </div>
      )}
      
      {onClear && (
        <button
          onClick={onClear}
          className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
        >
          Clear all
        </button>
      )}

      <AuthRequiredModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default ImageGenerateButton;