import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import queueManager from '../services/QueueService.js';
import CacheService from '../services/CacheService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const cache = new CacheService();

/**
 * Admin routes for monitoring and management
 * Should be protected with admin authentication in production
 */

// Middleware to check admin role (simplified for now)
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

/**
 * Get queue statistics
 */
router.get('/queues/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const stats = queueManager.getAllStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get queue stats', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

/**
 * Get specific queue details
 */
router.get('/queues/:name', authenticate, requireAdmin, (req, res) => {
  try {
    const { name } = req.params;
    const queue = queueManager.getQueue(name);
    const stats = queue.getStats();
    
    res.json({
      ...stats,
      jobs: {
        waiting: queue.queue.slice(0, 10), // First 10 waiting jobs
        processing: Array.from(queue.processing.values()).slice(0, 10),
        completed: Array.from(queue.completed.values()).slice(-10), // Last 10 completed
        failed: Array.from(queue.failed.values()).slice(-10) // Last 10 failed
      }
    });
  } catch (error) {
    logger.error('Failed to get queue details', error);
    res.status(500).json({ error: 'Failed to get queue details' });
  }
});

/**
 * Clear completed jobs in queue
 */
router.delete('/queues/:name/completed', authenticate, requireAdmin, (req, res) => {
  try {
    const { name } = req.params;
    const queue = queueManager.getQueue(name);
    const cleared = queue.clearCompleted();
    
    res.json({ 
      message: 'Completed jobs cleared',
      count: cleared 
    });
  } catch (error) {
    logger.error('Failed to clear completed jobs', error);
    res.status(500).json({ error: 'Failed to clear completed jobs' });
  }
});

/**
 * Clear failed jobs in queue
 */
router.delete('/queues/:name/failed', authenticate, requireAdmin, (req, res) => {
  try {
    const { name } = req.params;
    const queue = queueManager.getQueue(name);
    const cleared = queue.clearFailed();
    
    res.json({ 
      message: 'Failed jobs cleared',
      count: cleared 
    });
  } catch (error) {
    logger.error('Failed to clear failed jobs', error);
    res.status(500).json({ error: 'Failed to clear failed jobs' });
  }
});

/**
 * Retry failed job
 */
router.post('/queues/:name/retry/:jobId', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, jobId } = req.params;
    const queue = queueManager.getQueue(name);
    const job = queue.retryJob(jobId);
    
    res.json({ 
      message: 'Job retry scheduled',
      job 
    });
  } catch (error) {
    logger.error('Failed to retry job', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get cache statistics
 */
router.get('/cache/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cache stats', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

/**
 * Clear all cache
 */
router.delete('/cache/clear', authenticate, requireAdmin, async (req, res) => {
  try {
    await cache.clear();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Failed to clear cache', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * Delete cache by pattern
 */
router.delete('/cache/pattern', authenticate, requireAdmin, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }
    
    const deleted = await cache.deletePattern(pattern);
    res.json({ 
      message: 'Cache entries deleted',
      count: deleted 
    });
  } catch (error) {
    logger.error('Failed to delete cache pattern', error);
    res.status(500).json({ error: 'Failed to delete cache pattern' });
  }
});

/**
 * Get system health
 */
router.get('/health', authenticate, requireAdmin, (req, res) => {
  try {
    const queueStats = queueManager.getAllStats();
    const cacheStats = cache.getStats();
    
    // Calculate health score
    let healthScore = 100;
    let issues = [];
    
    // Check queues
    Object.entries(queueStats).forEach(([name, stats]) => {
      if (stats.failed > 10) {
        healthScore -= 10;
        issues.push(`Queue ${name} has ${stats.failed} failed jobs`);
      }
      if (stats.waiting > 100) {
        healthScore -= 5;
        issues.push(`Queue ${name} has ${stats.waiting} waiting jobs`);
      }
    });
    
    // Check cache
    const hitRate = parseFloat(cacheStats.hitRate);
    if (hitRate < 50) {
      healthScore -= 5;
      issues.push(`Low cache hit rate: ${cacheStats.hitRate}`);
    }
    
    res.json({
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
      score: healthScore,
      issues,
      metrics: {
        queues: queueStats,
        cache: cacheStats,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    logger.error('Failed to get system health', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

export default router;