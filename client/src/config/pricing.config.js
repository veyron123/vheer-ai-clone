// AI Model Pricing Configuration
export const MODEL_PRICING = {
  // Flux Models
  'flux-pro': {
    name: 'Flux Pro',
    credits: 10,
    description: 'Fast & reliable'
  },
  'flux-max': {
    name: 'Flux Max', 
    credits: 20,
    description: 'Maximum quality'
  },
  
  // GPT Image Models
  'gpt-image': {
    name: 'GPT Image',
    credits: 30,
    description: 'Advanced AI'
  },
  
  // Midjourney Models (future)
  'midjourney': {
    name: 'Midjourney',
    credits: 25,
    description: 'Artistic style'
  },
  
  // Default fallback
  'default': {
    name: 'Standard',
    credits: 10,
    description: 'Default model'
  }
};

/**
 * Get pricing info for a model
 * @param {string} modelId - Model identifier
 * @returns {object} Pricing information
 */
export const getModelPricing = (modelId) => {
  return MODEL_PRICING[modelId] || MODEL_PRICING.default;
};

/**
 * Get credits cost for a model
 * @param {string} modelId - Model identifier 
 * @returns {number} Credits required
 */
export const getModelCredits = (modelId) => {
  return getModelPricing(modelId).credits;
};

/**
 * Check if user has enough credits for model
 * @param {number} userCredits - User's current credits
 * @param {string} modelId - Model identifier
 * @returns {boolean} Whether user can afford generation
 */
export const canAffordGeneration = (userCredits, modelId) => {
  return userCredits >= getModelCredits(modelId);
};

/**
 * Format pricing display text
 * @param {string} modelId - Model identifier
 * @returns {string} Formatted pricing text
 */
export const formatPricingText = (modelId) => {
  const pricing = getModelPricing(modelId);
  return `${pricing.credits} / image, ${pricing.description}`;
};