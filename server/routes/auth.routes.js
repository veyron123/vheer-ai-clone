import { Router } from 'express';
import passport from '../config/passport.js';
import { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  oauthSuccess,
  oauthFailure,
  deleteAccount
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Capture frontend origin to redirect users back after OAuth
const captureOAuthOrigin = (req, res, next) => {
  try {
    const frontendCandidates = [];
    const referer = req.get('referer');
    if (referer) frontendCandidates.push(referer);
    if (req.query.redirect_uri) frontendCandidates.push(req.query.redirect_uri);

    const configuredFrontend = process.env.FRONTEND_URL;
    if (configuredFrontend) {
      try {
        const url = new URL(configuredFrontend);
        frontendCandidates.push(`${url.protocol}//${url.host}`);
      } catch (error) {
        console.warn('⚠️ Invalid FRONTEND_URL value, ignoring for OAuth redirect:', configuredFrontend);
      }
    }

    const serverHost = req.get('host');
    frontendCandidates.some(candidate => {
      try {
        const url = new URL(candidate);
        if (url.host !== serverHost) {
          const base = `${url.protocol}//${url.host}`;
          allowedHosts.add(base);
          req.session.oauthFrontendBase = base;
          console.log('🔁 [OAuth] Captured frontend origin for redirect:', base);
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse OAuth origin candidate:', candidate, error.message);
      }
      return false;
    });

    if (!req.session.oauthFrontendBase) {
      console.log('ℹ️ [OAuth] Using default frontend origin for redirect');
    }
  } catch (error) {
    console.warn('⚠️ Failed to capture OAuth referer:', error.message);
  }
  next();
};

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', 
  captureOAuthOrigin,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback', 
  (req, res, next) => {
    console.log('=== Google Callback Debug ===');
    console.log('Query params:', req.query);
    console.log('Has code:', !!req.query.code);
    console.log('Has error:', !!req.query.error);
    if (req.query.error) {
      console.log('Google OAuth Error:', req.query.error, req.query.error_description);
    }
    next();
  },
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: '/auth/failure',
      failureMessage: true 
    })(req, res, (err) => {
      if (err) {
        console.error('=== Passport Authentication Error ===');
        console.error('Error type:', err.name);
        console.error('Error message:', err.message);
        console.error('Full error:', err);
        return next(err);
      }
      next();
    });
  },
  oauthSuccess
);

// Facebook OAuth routes
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/failure' }),
  oauthSuccess
);

// OAuth handlers
router.get('/failure', oauthFailure);

// Temporary development login (remove in production)
console.log('NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  router.get('/dev-login', async (req, res) => {
    try {
      // Create a test user for development
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      let testUser = await prisma.user.findFirst({
        where: { email: 'test@localhost.dev' },
        include: { subscription: true }
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: 'test@localhost.dev',
            username: 'testuser_' + Date.now(),
            fullName: 'Test User',
            emailVerified: true,
            totalCredits: 1000,
            lastCreditUpdate: new Date(),
            subscription: {
              create: {
                plan: 'FREE',
                status: 'ACTIVE'
              }
            }
          },
          include: { subscription: true }
        });
      }

      // Generate JWT token
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5178';
      res.redirect(`${frontendURL}/en/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        fullName: testUser.fullName,
        avatar: testUser.avatar,
        subscription: testUser.subscription
      }))}`);
    } catch (error) {
      console.error('Dev login error:', error);
      res.status(500).json({ error: 'Development login failed' });
    }
  });
}

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
