import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import passport from './config/passport.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import imageRoutes from './routes/image.routes.js';
import imagesRoutes from './routes/images.routes.js';
import generationRoutes from './routes/generation.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import creditRoutes from './routes/credit.routes.js';
import fluxRoutes from './routes/flux.routes.js';
import gptimageRoutes from './routes/gptimage.routes.js';
import qwenRoutes from './routes/qwen.routes.js';
import gptImageTextToImageRoutes from './routes/gptImageTextToImage.routes.js';
import midjourneyRoutes from './routes/midjourney.routes.js';
// Video generator moved to .ignore folder
// import lumaVideoRoutes from './routes/lumaVideoRoutes.js';
import runwayVideoRoutes from './routes/runwayVideo.routes.js';
import wayforpayRoutes from './routes/wayforpay.routes.js';
import testSubscriptionRoutes from './routes/test-subscription-expiry.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes, { setupWebSocket } from './routes/webhook.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';
import { checkDailyCredits } from './middleware/credit.middleware.js';
import CreditCronJob from './jobs/creditCronJob.js';
import initializeSubscriptionExpiryJobs from './jobs/subscriptionExpiryJob.js';
import initializeAutoPaymentJobs from './jobs/autoPaymentJob.js';

// Load environment variables first
dotenv.config();

// Environment validation and configuration
import { validateEnv } from './config/validateEnv.js';
import { corsOptions, securityHeaders } from './config/cors.config.js';
import logger from './utils/logger.js';

// Validate environment variables at startup
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma client for session store
const prisma = new PrismaClient();

// Trust proxy - required for Render deployment
app.set('trust proxy', 1); // Trust only first proxy

// Rate limiting with proper proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  trustProxy: true, // Trust the first proxy
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration for OAuth with Prisma store
app.use(session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: true,
  saveUninitialized: true,
  store: new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000, // 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  )
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', limiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// OAuth Routes (without /api prefix for simpler callback URLs)
app.use('/auth', authRoutes);

// Apply daily credit check middleware to all authenticated routes
app.use('/api', checkDailyCredits);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imagesRoutes); // New images route for saved images
app.use('/api/image', imageRoutes); // Keep existing image route
app.use('/api/generate', generationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/flux', fluxRoutes);
app.use('/api/gptimage', gptimageRoutes);
app.use('/api/qwen', qwenRoutes);
app.use('/api/gpt-image-text', gptImageTextToImageRoutes);
app.use('/api/midjourney', midjourneyRoutes);
// Video generator moved to .ignore folder
// app.use('/api/video', lumaVideoRoutes);
app.use('/api/runway-video', runwayVideoRoutes);
app.use('/api/payments/wayforpay', wayforpayRoutes);

// Test routes (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', testSubscriptionRoutes);
}

// Admin routes
app.use('/api/admin', adminRoutes);

// Webhook routes
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Favicon route - prevent 500 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  // Serve static assets with proper headers
  app.use(express.static(clientBuildPath, {
    maxAge: '1y', // Cache static assets for 1 year
    setHeaders: (res, path) => {
      // Don't cache HTML files
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  
  // Handle React Router (serve index.html for non-API routes)
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Log the request for debugging
    logger.debug('Serving SPA route', { path: req.path });
    
    try {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } catch (error) {
      logger.error('Failed to serve index.html', error);
      next(error);
    }
  });
}

// Error handling middleware
app.use(errorHandler);

// Initialize credit cron jobs
CreditCronJob.init();

// Initialize subscription expiry cron jobs
initializeSubscriptionExpiryJobs();
initializeAutoPaymentJobs();

// Start server with increased timeout
const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Setup WebSocket for real-time admin notifications
const wss = setupWebSocket(server);

// Increase server timeout to 5 minutes for long-running requests like image generation
server.setTimeout(300000); // 5 minutes
server.keepAliveTimeout = 310000; // Slightly longer than timeout
server.headersTimeout = 320000; // Even longer for headers 
