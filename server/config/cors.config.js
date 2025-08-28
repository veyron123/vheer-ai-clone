import logger from '../utils/logger.js';

/**
 * CORS Configuration
 * Properly manages allowed origins based on environment
 */

// Get allowed origins from environment or use defaults
function getAllowedOrigins() {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    // Production origins - should be from environment variable
    const prodOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : [];
    
    // Add known production domains
    const knownDomains = [
      'https://colibrrri.com',
      'https://www.colibrrri.com',
      'https://vheer.ai',
      'https://www.vheer.ai',
      // WayForPay domains for payment callbacks
      'https://secure.wayforpay.com',
      'https://api.wayforpay.com',
      'https://www.wayforpay.com'
    ];
    
    // If deployed on Render, add Render URLs
    if (process.env.RENDER) {
      knownDomains.push(
        'https://vheer-client.onrender.com',
        'https://vheer-api.onrender.com',
        'https://colibrrri-fullstack.onrender.com'
      );
    }
    
    // Combine and deduplicate
    const allOrigins = [...new Set([...prodOrigins, ...knownDomains])];
    
    logger.info('Production CORS origins configured', { 
      count: allOrigins.length,
      origins: allOrigins.map(o => o.replace(/https?:\/\//, '')) // Log domains only
    });
    
    return allOrigins;
  } else {
    // Development origins
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Add custom dev origin if specified
    if (process.env.DEV_CORS_ORIGIN) {
      devOrigins.push(process.env.DEV_CORS_ORIGIN);
    }
    
    return devOrigins;
  }
}

/**
 * CORS options configuration
 */
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (same-origin requests, mobile apps, Postman, etc.)
    // This includes SPA requests to the same server
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked request from unauthorized origin', { 
        origin,
        allowedCount: allowedOrigins.length 
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies and authorization headers
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page'
  ],
  
  maxAge: 86400, // 24 hours
  
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

/**
 * Helper function to check if an origin is allowed
 */
export function isOriginAllowed(origin) {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Middleware to add security headers
 */
export function securityHeaders(req, res, next) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
}

export default corsOptions;