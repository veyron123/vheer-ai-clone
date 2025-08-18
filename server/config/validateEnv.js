import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables at startup
 * Fails fast if critical variables are missing
 */
export function validateEnv() {
  const requiredVars = {
    // Database
    DATABASE_URL: 'Database connection string',
    
    // Security
    JWT_SECRET: 'JWT secret for token generation',
    
    // API Keys (Production)
    FLUX_API_KEY: 'Flux AI API key',
    GPT_IMAGE_API_KEY: 'GPT Image API key',
    IMGBB_API_KEY: 'ImgBB storage API key',
    
    // URLs
    CORS_ORIGIN: 'Allowed CORS origin',
  };

  const optionalVars = {
    // Optional APIs
    MIDJOURNEY_API_KEY: 'MidJourney API key (optional)',
    MIDJOURNEY_API_URL: 'MidJourney API URL (optional)',
    
    // OAuth (optional if not using social login)
    GOOGLE_CLIENT_ID: 'Google OAuth client ID',
    GOOGLE_CLIENT_SECRET: 'Google OAuth client secret',
    
    // Session
    SESSION_SECRET: 'Session secret for OAuth',
    
    // URLs
    FLUX_API_URL: 'Flux API endpoint',
    GPTIMAGE_API_URL: 'GPT Image API endpoint',
    BASE_URL: 'Base URL of the application',
    FRONTEND_URL: 'Frontend URL',
  };

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const [key, description] of Object.entries(requiredVars)) {
    if (!process.env[key]) {
      missing.push(`❌ ${key}: ${description}`);
    }
  }

  // Check optional variables (warnings only)
  for (const [key, description] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      warnings.push(`⚠️  ${key}: ${description}`);
    }
  }

  // Log the configuration status
  console.log('🔧 Environment Configuration Check');
  console.log('===================================');
  
  if (missing.length > 0) {
    console.error('\n🚨 Missing Required Environment Variables:');
    missing.forEach(msg => console.error(msg));
    
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ Application cannot start without required environment variables!');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Running in development mode with missing variables. Some features may not work.');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log('\n📝 Optional environment variables not set:');
    warnings.forEach(msg => console.log(msg));
  }

  // Additional security checks
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters for security');
  }

  if (process.env.NODE_ENV === 'production') {
    // Production-specific checks
    if (!process.env.DATABASE_URL?.includes('ssl=')) {
      console.warn('⚠️  DATABASE_URL should use SSL in production');
    }
    
    if (process.env.CORS_ORIGIN === '*') {
      console.warn('⚠️  CORS_ORIGIN should not be * in production');
    }
  }

  console.log('===================================\n');
}

// Mask sensitive data for logging
export function maskSensitiveData(key, value) {
  const sensitiveKeys = [
    'JWT_SECRET',
    'DATABASE_URL',
    'FLUX_API_KEY',
    'GPT_IMAGE_API_KEY',
    'IMGBB_API_KEY',
    'MIDJOURNEY_API_KEY',
    'GOOGLE_CLIENT_SECRET',
    'SESSION_SECRET',
    'VITE_FAL_API_KEY',
    'VITE_FLUX_API_KEY'
  ];

  if (sensitiveKeys.includes(key) && value) {
    // Show first 4 and last 4 characters only
    if (value.length > 10) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    return '***';
  }
  
  return value;
}

export default validateEnv;