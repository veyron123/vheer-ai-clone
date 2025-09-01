import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  console.log('🔐 [AUTH MIDDLEWARE] Starting authentication check...');
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔐 [AUTH MIDDLEWARE] Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format',
        message: 'Expected format: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token has required fields
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token missing required fields'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        totalCredits: true,
        emailVerified: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Invalid authentication token'
      });
    }

    // Check if user's email is verified (optional - can be removed if not needed)
    // if (!user.emailVerified) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Email not verified',
    //     message: 'Please verify your email to continue'
    //   });
    // }

    // Attach user to request
    req.user = user;
    req.userId = user.id; // For backward compatibility
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }

    // Log unexpected errors (but don't expose details to client)
    console.error('Authentication error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token provided
 * Useful for endpoints that work with or without auth
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No auth provided, continue without user
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.userId) {
        req.user = null;
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          totalCredits: true,
          emailVerified: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true
            }
          }
        }
      });

      req.user = user;
      req.userId = user?.id;
    } catch (error) {
      // Token is invalid, continue without user
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Admin authentication middleware
 * Requires user to be authenticated and have admin role
 */
export const adminAuth = async (req, res, next) => {
  // First run regular authentication
  await authenticate(req, res, () => {
    // Check if user is admin by email
    if (!req.user || req.user.email !== 'unitradecargo@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }
    next();
  });
};

/**
 * Rate limiting middleware helper
 * Can be used with express-rate-limit for API protection
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  };
  
  return { ...defaultOptions, ...options };
};

export default authenticate;