/**
 * Standardized API response utilities
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 */
export function sendError(res, error, statusCode = 500, details = {}) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...details
  });
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info
 */
export function sendPaginated(res, items, pagination) {
  return res.json({
    success: true,
    data: items,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || items.length,
      hasMore: pagination.hasMore || false
    }
  });
}

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {any} data - Created resource
 * @param {string} message - Success message
 */
export function sendCreated(res, data, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send no content response (204)
 * @param {Object} res - Express response object
 */
export function sendNoContent(res) {
  return res.status(204).send();
}

/**
 * Send bad request response (400)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {Object} details - Additional details
 */
export function sendBadRequest(res, error = 'Bad request', details = {}) {
  return sendError(res, error, 400, details);
}

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 */
export function sendUnauthorized(res, error = 'Unauthorized') {
  return sendError(res, error, 401);
}

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 */
export function sendForbidden(res, error = 'Forbidden') {
  return sendError(res, error, 403);
}

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 */
export function sendNotFound(res, error = 'Resource not found') {
  return sendError(res, error, 404);
}

/**
 * Send conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {Object} details - Additional details
 */
export function sendConflict(res, error = 'Conflict', details = {}) {
  return sendError(res, error, 409, details);
}

/**
 * Send validation error response (422)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {Array} errors - Validation errors
 */
export function sendValidationError(res, error = 'Validation failed', errors = []) {
  return sendError(res, error, 422, { errors });
}

/**
 * Send server error response (500)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {Object} details - Additional details
 */
export function sendServerError(res, error = 'Internal server error', details = {}) {
  // In production, don't expose internal error details
  const safeDetails = process.env.NODE_ENV === 'production' ? {} : details;
  return sendError(res, error, 500, safeDetails);
}

/**
 * Send service unavailable response (503)
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 */
export function sendServiceUnavailable(res, error = 'Service temporarily unavailable') {
  return sendError(res, error, 503);
}

/**
 * Standard response wrapper for async handlers
 * @param {Function} handler - Async handler function
 */
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Format API response for AI generation
 * @param {Object} res - Express response object
 * @param {Object} result - Generation result
 * @param {Object} options - Additional options
 */
export function sendGenerationResult(res, result, options = {}) {
  const { credits, model, user } = options;
  
  return res.json({
    success: true,
    image: result.image || result.url,
    thumbnailUrl: result.thumbnailUrl,
    credits: {
      used: credits,
      remaining: user?.totalCredits
    },
    model,
    metadata: result.metadata || {}
  });
}

/**
 * Format credit error response
 * @param {Object} res - Express response object
 * @param {number} required - Required credits
 * @param {number} available - Available credits
 * @param {string} modelId - Model ID
 */
export function sendInsufficientCredits(res, required, available, modelId) {
  return sendBadRequest(res, 'Insufficient credits', {
    required,
    available,
    modelId,
    message: `You need ${required} credits but only have ${available}`
  });
}