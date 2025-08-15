import { Router } from 'express';
import passport from '../config/passport.js';
import { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  oauthSuccess,
  oauthFailure
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
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

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;