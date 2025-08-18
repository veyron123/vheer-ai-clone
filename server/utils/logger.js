/**
 * Simple logger utility for safe logging
 * Masks sensitive data and provides environment-aware logging
 */

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// List of sensitive keys to mask
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'jwt',
  'database_url',
  'db_url',
  'client_secret'
];

/**
 * Masks sensitive data in objects
 */
function maskSensitiveData(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const masked = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    const value = obj[key];
    
    // Check if key contains sensitive words
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey)
    );
    
    if (isSensitive && value) {
      masked[key] = typeof value === 'string' && value.length > 4
        ? `${value.substring(0, 2)}...${value.substring(value.length - 2)}`
        : '***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Formats log message with timestamp
 */
function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    const maskedData = maskSensitiveData(data);
    logMessage += ` ${JSON.stringify(maskedData)}`;
  }
  
  return logMessage;
}

const logger = {
  /**
   * Info level logging
   */
  info(message, data) {
    if (!isTest) {
      console.log(formatMessage('INFO', message, data));
    }
  },
  
  /**
   * Warning level logging
   */
  warn(message, data) {
    if (!isTest) {
      console.warn(formatMessage('WARN', message, data));
    }
  },
  
  /**
   * Error level logging
   */
  error(message, error, data) {
    if (!isTest) {
      const errorData = {
        ...data,
        error: error instanceof Error ? {
          message: error.message,
          stack: isDevelopment ? error.stack : undefined
        } : error
      };
      console.error(formatMessage('ERROR', message, errorData));
    }
  },
  
  /**
   * Debug level logging (only in development)
   */
  debug(message, data) {
    if (isDevelopment && !isTest) {
      console.log(formatMessage('DEBUG', message, data));
    }
  },
  
  /**
   * HTTP request logging
   */
  http(req, res, responseTime) {
    if (!isTest) {
      const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };
      
      // Don't log sensitive headers
      if (isDevelopment) {
        logData.headers = maskSensitiveData(req.headers);
      }
      
      this.info('HTTP Request', logData);
    }
  }
};

export default logger;