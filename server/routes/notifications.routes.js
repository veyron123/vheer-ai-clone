import express from 'express';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  sendTestNotification,
  getNotificationSettings,
  updateNotificationSettings,
  sendAbandonedCartEmail,
  getEmailSettings,
  updateEmailSettings
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes for push notifications subscription
router.post('/subscribe', subscribeToNotifications);
router.post('/unsubscribe', unsubscribeFromNotifications);

// Admin routes
router.use(authenticate);
router.use(isAdmin);

// Push notification management
router.get('/settings', getNotificationSettings);
router.post('/settings', updateNotificationSettings);
router.post('/test', sendTestNotification);

// Email notification management
router.get('/email/settings', getEmailSettings);
router.post('/email/settings', updateEmailSettings);
router.post('/email/test', sendAbandonedCartEmail);

export default router;