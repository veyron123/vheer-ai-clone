/**
 * Utility functions for handling AI service errors with user-friendly messages
 */

/**
 * Get user-friendly error message for AI service failures
 * @param {Error} error - The error object from the AI service
 * @param {string} serviceName - Name of the AI service (e.g., 'Flux', 'GPT Image', 'Qwen')
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyAIError(error, serviceName) {
  const status = error.response?.status;
  const message = error.message || 'Unknown error';
  
  // Server errors (5xx) - Not our fault, service is down
  if (status >= 500 && status < 600) {
    return `The ${serviceName} AI service is temporarily unavailable due to server maintenance. Please try again later or use a different AI model.`;
  }
  
  // Rate limiting (429) - Service overloaded
  if (status === 429) {
    return `The ${serviceName} AI service is experiencing high demand. Please wait a moment and try again, or use a different AI model.`;
  }
  
  // Authentication errors (401/403) - API key issues
  if (status === 401 || status === 403) {
    return `There's a configuration issue with the ${serviceName} AI service. Please contact support or try a different AI model.`;
  }
  
  // Bad request (400) - Usually our fault, show original message
  if (status === 400) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || message;
    return `Invalid request to ${serviceName}: ${errorMsg}`;
  }
  
  // Network/timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
    return `Unable to connect to ${serviceName} AI service. Please check your internet connection and try again.`;
  }
  
  // Timeout errors
  if (message.toLowerCase().includes('timeout')) {
    return `The ${serviceName} AI service is taking too long to respond. Please try again or use a different AI model.`;
  }
  
  // Default fallback for unknown errors
  return `An unexpected error occurred with ${serviceName} AI service. Please try again later or use a different AI model.`;
}

/**
 * Check if error is a server-side issue (not our fault)
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a server-side issue
 */
export function isServerSideError(error) {
  const status = error.response?.status;
  
  // 5xx errors are server-side
  if (status >= 500 && status < 600) return true;
  
  // Rate limiting is service-side
  if (status === 429) return true;
  
  // Network connectivity issues
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') return true;
  
  // Timeout issues
  if (error.message && error.message.toLowerCase().includes('timeout')) return true;
  
  return false;
}

/**
 * Log error with appropriate level based on whether it's our fault or not
 * @param {Error} error - The error object
 * @param {string} serviceName - Name of the AI service
 * @param {string} context - Additional context for the error
 */
export function logAIServiceError(error, serviceName, context = '') {
  const isServerSide = isServerSideError(error);
  const logLevel = isServerSide ? 'warn' : 'error';
  const prefix = isServerSide ? `[${serviceName} Service Issue]` : `[${serviceName} Error]`;
  
  console[logLevel](`${prefix} ${context}:`, {
    status: error.response?.status,
    message: error.message,
    data: error.response?.data,
    isServerSide,
    timestamp: new Date().toISOString()
  });
  
  // Only log full error details for client-side errors (our bugs)
  if (!isServerSide) {
    console.error(`${prefix} Full error details:`, error);
  }
}