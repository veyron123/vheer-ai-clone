import logger from '../utils/logger.js';

/**
 * Cache Service
 * Provides caching functionality with in-memory storage (can be replaced with Redis)
 */
class CacheService {
  constructor() {
    // In-memory cache for now
    // TODO: Replace with Redis in production
    this.cache = new Map();
    this.timers = new Map();
    
    // Stats
    this.hits = 0;
    this.misses = 0;
    
    logger.info('Cache service initialized (in-memory)');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      if (this.cache.has(key)) {
        this.hits++;
        const value = this.cache.get(key);
        logger.debug('Cache hit', { key, hits: this.hits });
        return value;
      }
      
      this.misses++;
      logger.debug('Cache miss', { key, misses: this.misses });
      return null;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600)
   */
  async set(key, value, ttl = 3600) {
    try {
      // Clear existing timer if any
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Set value
      this.cache.set(key, value);

      // Set expiration
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl * 1000);
        
        this.timers.set(key, timer);
      }

      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      // Clear timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // Delete value
      const deleted = this.cache.delete(key);
      
      if (deleted) {
        logger.debug('Cache delete', { key });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      
      this.cache.clear();
      this.timers.clear();
      this.hits = 0;
      this.misses = 0;
      
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough estimate)
   */
  getMemoryUsage() {
    let bytes = 0;
    
    for (const [key, value] of this.cache.entries()) {
      // Rough estimate
      bytes += key.length * 2; // Unicode chars
      bytes += JSON.stringify(value).length * 2;
    }
    
    return {
      bytes,
      mb: (bytes / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Cache with automatic key generation
   * @param {Function} fn - Function to cache
   * @param {Array} args - Function arguments
   * @param {Object} options - Cache options
   */
  async memoize(fn, args = [], options = {}) {
    const { ttl = 3600, keyPrefix = 'memoize' } = options;
    
    // Generate cache key from function name and arguments
    const key = `${keyPrefix}:${fn.name}:${JSON.stringify(args)}`;
    
    // Check cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Cache result
    await this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Pattern-based cache deletion
   * @param {string} pattern - Pattern to match (e.g., "user:*")
   */
  async deletePattern(pattern) {
    try {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      let deleted = 0;
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          await this.delete(key);
          deleted++;
        }
      }
      
      logger.info('Pattern delete', { pattern, deleted });
      return deleted;
    } catch (error) {
      logger.error('Pattern delete error', error, { pattern });
      return 0;
    }
  }
}

// Export singleton instance
export default CacheService;

// Also export for Redis implementation (future)
export class RedisCacheService extends CacheService {
  constructor(redisClient) {
    super();
    this.redis = redisClient;
    logger.info('Cache service initialized (Redis)');
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.hits++;
        return JSON.parse(value);
      }
      this.misses++;
      return null;
    } catch (error) {
      logger.error('Redis get error', error, { key });
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error', error, { key });
      return false;
    }
  }

  async delete(key) {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error', error, { key });
      return false;
    }
  }

  async clear() {
    try {
      await this.redis.flushdb();
      this.hits = 0;
      this.misses = 0;
      return true;
    } catch (error) {
      logger.error('Redis clear error', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        logger.info('Redis pattern delete', { pattern, deleted });
        return deleted;
      }
      return 0;
    } catch (error) {
      logger.error('Redis pattern delete error', error, { pattern });
      return 0;
    }
  }
}