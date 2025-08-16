import React, { useState } from 'react';
import { Sparkles, Loader2, X, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import PricingDisplay from '../ui/PricingDisplay';
import AuthRequiredModal from '../ui/AuthRequiredModal';

/**
 * Unified Generate Button Component following KISS principle
 * Handles authentication, credit checking, and generation states
 */
const UniversalGenerateButton = ({
  onGenerate,
  onClear,
  isGenerating = false,
  disabled = false,
  aiModel = 'flux-pro',
  showClearButton = false,
  generateText = 'Generate',
  clearText = 'Clear all',
  className = '',
  fullWidth = true
}) => {
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGenerateClick = () => {
    // Check authentication
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Proceed with generation
    onGenerate();
  };

  // Button state calculations
  const isButtonDisabled = isAuthenticated ? (disabled || isGenerating) : false;
  const isButtonActive = (!disabled && !isGenerating) || !isAuthenticated;
  const baseClassName = fullWidth ? 'w-full' : '';

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Generate Button */}
      <button
        onClick={handleGenerateClick}
        disabled={isButtonDisabled}
        className={`${baseClassName} py-3 px-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
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
            {generateText}
          </>
        )}
      </button>

      {/* Pricing Display */}
      {isAuthenticated && (
        <PricingDisplay 
          modelId={aiModel} 
          className="mt-1" 
          showAffordability={true} 
        />
      )}

      {/* Login Prompt */}
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

      {/* Clear Button */}
      {showClearButton && onClear && (
        <button
          onClick={onClear}
          className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
        >
          {clearText}
        </button>
      )}

      {/* Auth Modal */}
      <AuthRequiredModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default UniversalGenerateButton;