import React, { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import PricingDisplay from '../ui/PricingDisplay';
import AuthRequiredModal from '../ui/AuthRequiredModal';

const GenerateButton = ({ onClick, disabled, isGenerating, aiModel = 'flux-pro' }) => {
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    onClick();
  };

  return (
    <div>
      <button
        onClick={handleClick}
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
        ) : !isAuthenticated ? (
          <span className="flex items-center justify-center">
            <Lock className="w-5 h-5 mr-2" />
            Sign In to Generate
          </span>
        ) : (
          'Generate'
        )}
      </button>
      
      {isAuthenticated && (
        <PricingDisplay 
          modelId={aiModel} 
          className="mt-2" 
          showAffordability={true} 
        />
      )}
      
      {!isAuthenticated && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            Sign in to start generating amazing AI images
          </p>
          <p className="text-xs text-yellow-600 font-medium">
            ⭐ Get 10 free generations on signup!
          </p>
        </div>
      )}

      <AuthRequiredModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default GenerateButton;