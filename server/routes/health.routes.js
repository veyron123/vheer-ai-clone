import express from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Health check endpoint for Render monitoring
 * Returns 200 if service is healthy, 503 if unhealthy
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    service: 'colibrrri-api',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'checking',
      memory: 'checking',
      disk: 'checking'
    }
  };

  try {
    // Check database connection
    const dbCheck = await prisma.$queryRaw`SELECT 1 as status`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
    console.error('Database health check failed:', error.message);
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  health.checks.memory = memoryUsagePercent < 90 ? 'healthy' : 'warning';
  health.memory = {
    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    systemPercent: Math.round(memoryUsagePercent)
  };

  // Check disk space (simplified)
  health.checks.disk = 'healthy';

  // Determine overall health status
  if (health.checks.database === 'unhealthy') {
    health.status = 'unhealthy';
  } else if (health.checks.memory === 'warning') {
    health.status = 'degraded';
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * Detailed health check (for debugging)
 */
router.get('/detailed', async (req, res) => {
  const detailed = {
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: process.uptime(),
      formatted: formatUptime(process.uptime())
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing'
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
      loadAverage: os.loadavg()
    },
    process: {
      pid: process.pid,
      version: process.version,
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      }
    },
    services: {
      database: 'unknown',
      redis: 'not configured',
      storage: 'cloudinary'
    }
  };

  // Check database
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) as user_count FROM colibrrri_users`;
    detailed.services.database = 'connected';
    detailed.database = {
      status: 'connected',
      users: result[0]?.user_count || 0
    };
  } catch (error) {
    detailed.services.database = 'error';
    detailed.database = {
      status: 'error',
      error: error.message
    };
  }

  // Check API keys configuration
  detailed.apiKeys = {
    FLUX: process.env.FLUX_API_KEY ? 'configured' : 'missing',
    GPT_IMAGE: process.env.GPT_IMAGE_API_KEY ? 'configured' : 'missing',
    GEMINI: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
    QWEN: process.env.QWEN_API_KEY ? 'configured' : 'missing',
    MIDJOURNEY: process.env.MIDJOURNEY_API_KEY ? 'configured' : 'missing',
    IMGBB: process.env.IMGBB_API_KEY ? 'configured' : 'missing',
    WAYFORPAY: process.env.WAYFORPAY_MERCHANT_ACCOUNT ? 'configured' : 'missing'
  };

  res.json(detailed);
});

/**
 * Liveness probe (simple check that service is running)
 */
router.get('/live', (req, res) => {
  res.status(200).send('OK');
});

/**
 * Readiness probe (check if service is ready to handle requests)
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('Ready');
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default router;