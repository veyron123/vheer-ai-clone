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

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', 
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

      const frontendURL = 'http://localhost:5183';
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