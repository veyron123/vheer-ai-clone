/**
 * Global Error Handler Middleware
 * Centralizes error handling and provides consistent error responses
 */

/**
 * Custom Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Error Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Development Error Response
 * Sends detailed error information in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    details: err
  });
};

/**
 * Production Error Response
 * Sends filtered error information in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      error: 'Something went wrong',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Handle specific error types
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401, 'JWT_ERROR');

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401, 'JWT_EXPIRED');

const handlePrismaError = (err) => {
  // Handle Prisma-specific errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0];
    return new AppError(`${field} already exists`, 400, 'DUPLICATE_FIELD');
  }
  
  if (err.code === 'P2025') {
    return new AppError('Record not found', 404, 'NOT_FOUND');
  }
  
  if (err.code === 'P2003') {
    return new AppError('Foreign key constraint failed', 400, 'CONSTRAINT_ERROR');
  }
  
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

// Stripe error handler removed - using WayForPay only

const handleMulterError = (err) => {
  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 400, 'FILE_TOO_LARGE');
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400, 'TOO_MANY_FILES');
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected field', 400, 'UNEXPECTED_FIELD');
  }
  
  return new AppError('File upload failed', 500, 'UPLOAD_ERROR');
};

/**
 * Global Error Handler Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error details for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    });
  }

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') error = handlePrismaError(err);
  
  // Stripe removed - using WayForPay only
  
  // Multer errors
  if (err.name === 'MulterError') error = handleMulterError(err);
  
  // AI Service errors
  if (err.message?.includes('Insufficient credits')) {
    error = new AppError(err.message, 402, 'INSUFFICIENT_CREDITS');
  }
  
  if (err.message?.includes('API quota exceeded')) {
    error = new AppError(err.message, 429, 'QUOTA_EXCEEDED');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Unhandled Rejection Handler
 * Catches unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    // Give time to log the error before shutting down
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

/**
 * Uncaught Exception Handler
 * Catches uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });
};

export default globalErrorHandler;