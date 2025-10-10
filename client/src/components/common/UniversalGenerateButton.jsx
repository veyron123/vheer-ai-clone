import React, { useState } from 'react';
import { Sparkles, Loader2, X, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import PricingDisplay from '../ui/PricingDisplay';
import AuthRequiredModal from '../ui/AuthRequiredModal';
import { getModelPricing } from '../../config/pricing.config';

/**
 * Unified Generate Button Component following KISS principle
 * Handles authentication, credit checking, and generation states
 */
const UniversalGenerateButton = ({
  onGenerate,
  onClear,
  isGenerating = false,
  disabled = false,
  aiModel = 'qwen-image',
  numImages = 1,
  showClearButton = false,
  generateText = 'Generate',
  clearText = 'Clear all',
  className = '',
  fullWidth = true,
  gothicStyle = false
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user can afford generation (only for authenticated users)
  const pricing = getModelPricing(aiModel);
  const userCredits = user?.totalCredits || 0;
  const totalCost = pricing.credits * numImages;
  const canAfford = !isAuthenticated || userCredits >= totalCost;

  const handleGenerateClick = () => {
    // Check authentication
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check credits (only for authenticated users)
    if (isAuthenticated && !canAfford) {
      return; // Don't generate if insufficient credits
    }

    // Proceed with generation
    onGenerate();
  };

  // Button state calculations
  const isButtonDisabled = isAuthenticated ? (disabled || isGenerating || !canAfford) : false;
  const isButtonActive = isAuthenticated ? (canAfford && !disabled && !isGenerating) : true;
  const baseClassName = fullWidth ? 'w-full' : '';

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Generate Button */}
      <button
        onClick={handleGenerateClick}
        disabled={isButtonDisabled}
        className={`${baseClassName} py-3 px-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
          gothicStyle 
            ? `rounded-lg border-2 shadow-lg ${
                isButtonActive
                  ? 'bg-gradient-to-r from-purple-900 to-red-900 border-orange-600 hover:from-purple-800 hover:to-red-800 text-orange-100 cursor-pointer shadow-orange-900/50'
                  : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed shadow-gray-600/30'
              }`
            : `rounded-lg ${
                isButtonActive
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`
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
          numImages={numImages}
          className="mt-1" 
          showAffordability={true} 
        />
      )}

      {/* Login Prompt */}
      {!isAuthenticated && (
        <div className="text-center">
          <p className="text-sm text-yellow-600 font-medium">
            ⭐ Get 100 free credits on signup!
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
