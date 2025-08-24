import React from 'react';
import { getModelPricing, canAffordGeneration } from '../../config/pricing.config';
import { useAuthStore } from '../../stores/authStore';

/**
 * PricingDisplay component shows cost information under Generate buttons
 * Displays credit cost and checks if user can afford generation
 * 
 * @param {string} modelId - Model identifier (flux-pro, flux-max, gpt-image)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showAffordability - Whether to show affordability indicator
 */
const PricingDisplay = ({ 
  modelId, 
  numImages = 1,
  className = '', 
  showAffordability = true 
}) => {
  const user = useAuthStore(state => state.user);
  const pricing = getModelPricing(modelId);
  const userCredits = user?.totalCredits || 0;
  const totalCost = pricing.credits * numImages;
  const canAfford = userCredits >= totalCost;

  // Format the pricing text to match screenshot: "20 credits/image" or "60 credits (20×3)"
  const getPricingText = () => {
    if (numImages === 1) {
      return `${pricing.credits} credits/image`;
    }
    return `${totalCost} credits (${pricing.credits}×${numImages})`;
  };

  // Get color based on affordability
  const getTextColor = () => {
    if (!showAffordability) return 'text-gray-500';
    return canAfford ? 'text-gray-500' : 'text-red-500';
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={`text-sm ${getTextColor()}`}>
        {getPricingText()}
      </span>
      {showAffordability && !canAfford && (
        <span className="ml-2 text-xs text-red-500 font-medium">
          (Insufficient credits)
        </span>
      )}
    </div>
  );
};

export default PricingDisplay;