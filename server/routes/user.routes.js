import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Placeholder for user routes
router.get('/profile/:username', async (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

export default router;