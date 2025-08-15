import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import imageRoutes from './routes/image.routes.js';
import generationRoutes from './routes/generation.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import creditRoutes from './routes/credit.routes.js';
import fluxRoutes from './routes/flux.routes.js';
import gptimageRoutes from './routes/gptimage.routes.js';
import midjourneyRoutes from './routes/midjourney.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';
import { checkDailyCredits } from './middleware/credit.middleware.js';
import CreditCronJob from './jobs/creditCronJob.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

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

// Middleware
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CORS_ORIGIN, 'https://vheer-client.onrender.com', 'https://vheer.ai', 'https://colibrrri.com']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', limiter);

// OAuth Routes (without /api prefix for simpler callback URLs)
app.use('/auth', authRoutes);

// Apply daily credit check middleware to all authenticated routes
app.use('/api', checkDailyCredits);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/flux', fluxRoutes);
app.use('/api/gptimage', gptimageRoutes);
app.use('/api/midjourney', midjourneyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Handle React Router (serve index.html for non-API routes)
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Initialize credit cron jobs
CreditCronJob.init();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 
