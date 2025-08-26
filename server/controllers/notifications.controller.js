import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/email.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Configure web-push только если ключи установлены
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.EMAIL_USER || 'admin@vheer.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Web-push configured with VAPID keys');
} else {
  console.log('⚠️ VAPID keys not found - push notifications will be disabled');
}

export const subscribeToNotifications = async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Save subscription to database
    const notificationSubscription = await prisma.notificationSubscription.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId,
        updatedAt: new Date()
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId || null
      }
    });

    logger.info('Push subscription saved', { subscriptionId: notificationSubscription.id });
    
    res.json({ 
      success: true, 
      message: 'Подписка на уведомления активирована',
      subscriptionId: notificationSubscription.id 
    });
  } catch (error) {
    logger.error('Failed to subscribe to notifications', error);
    res.status(500).json({ error: 'Не удалось подписаться на уведомления' });
  }
};

export const unsubscribeFromNotifications = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    await prisma.notificationSubscription.delete({
      where: { endpoint }
    });

    res.json({ success: true, message: 'Подписка на уведомления отключена' });
  } catch (error) {
    logger.error('Failed to unsubscribe from notifications', error);
    res.status(500).json({ error: 'Не удалось отписаться от уведомлений' });
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    // Проверяем наличие VAPID ключей
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'VAPID ключи не настроены. Push-уведомления отключены.' 
      });
    }

    const { message } = req.body;
    
    const subscriptions = await prisma.notificationSubscription.findMany({
      where: { isActive: true }
    });

    if (subscriptions.length === 0) {
      return res.json({ 
        success: true, 
        message: 'Нет активных подписок для отправки',
        sent: 0 
      });
    }

    const payload = JSON.stringify({
      title: '🧪 Тестовое уведомление',
      body: message || 'Это тестовое push-уведомление от Vheer!',
      icon: '/logo.png',
      badge: '/badge.png',
      data: {
        url: '/admin',
        type: 'test'
      }
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          
          await webpush.sendNotification(pushSubscription, payload);
          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          logger.error('Failed to send notification to subscription', {
            subscriptionId: sub.id,
            error: error.message
          });
          
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410) {
            await prisma.notificationSubscription.update({
              where: { id: sub.id },
              data: { isActive: false }
            });
          }
          
          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    logger.info('Test notification sent', { 
      total: subscriptions.length, 
      successful, 
      failed 
    });

    res.json({ 
      success: true, 
      message: `Уведомления отправлены: ${successful} успешно, ${failed} неудачно`,
      sent: successful,
      failed: failed
    });
  } catch (error) {
    logger.error('Failed to send test notifications', error);
    res.status(500).json({ error: 'Не удалось отправить тестовые уведомления' });
  }
};

export const sendPushNotification = async (title, body, data = {}, targetUserId = null) => {
  try {
    // Проверяем наличие VAPID ключей
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      logger.warn('Push notifications disabled - VAPID keys not configured');
      return { success: false, error: 'VAPID keys not configured' };
    }
    const whereClause = { isActive: true };
    if (targetUserId) {
      whereClause.userId = targetUserId;
    }

    const subscriptions = await prisma.notificationSubscription.findMany({
      where: whereClause
    });

    if (subscriptions.length === 0) {
      logger.info('No active subscriptions found for push notification');
      return { success: true, sent: 0 };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.png',
      badge: '/badge.png',
      data: {
        timestamp: Date.now(),
        ...data
      }
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          
          await webpush.sendNotification(pushSubscription, payload);
          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          logger.error('Failed to send push notification', {
            subscriptionId: sub.id,
            error: error.message
          });
          
          // Mark invalid subscriptions as inactive
          if (error.statusCode === 410) {
            await prisma.notificationSubscription.update({
              where: { id: sub.id },
              data: { isActive: false }
            });
          }
          
          return { success: false, subscriptionId: sub.id };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    logger.info('Push notification sent', { 
      title,
      total: subscriptions.length, 
      successful 
    });

    return { success: true, sent: successful };
  } catch (error) {
    logger.error('Failed to send push notification', { title, error: error.message });
    return { success: false, error: error.message };
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: [
            'push_notifications_enabled',
            'email_notifications_enabled',
            'abandoned_cart_delay_hours',
            'admin_email'
          ]
        }
      }
    });

    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Default values
    const response = {
      pushNotificationsEnabled: settingsMap.push_notifications_enabled === 'true',
      emailNotificationsEnabled: settingsMap.email_notifications_enabled === 'true',
      abandonedCartDelayHours: parseInt(settingsMap.abandoned_cart_delay_hours) || 2,
      adminEmail: settingsMap.admin_email || process.env.EMAIL_USER || ''
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get notification settings', error);
    res.status(500).json({ error: 'Не удалось получить настройки уведомлений' });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const {
      pushNotificationsEnabled,
      emailNotificationsEnabled,
      abandonedCartDelayHours,
      adminEmail
    } = req.body;

    const settings = [
      {
        key: 'push_notifications_enabled',
        value: pushNotificationsEnabled?.toString() || 'false'
      },
      {
        key: 'email_notifications_enabled',
        value: emailNotificationsEnabled?.toString() || 'false'
      },
      {
        key: 'abandoned_cart_delay_hours',
        value: (abandonedCartDelayHours || 2).toString()
      },
      {
        key: 'admin_email',
        value: adminEmail || process.env.EMAIL_USER || ''
      }
    ];

    await Promise.all(
      settings.map(setting => 
        prisma.appSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting
        })
      )
    );

    logger.info('Notification settings updated', req.body);
    
    res.json({ 
      success: true, 
      message: 'Настройки уведомлений обновлены' 
    });
  } catch (error) {
    logger.error('Failed to update notification settings', error);
    res.status(500).json({ error: 'Не удалось обновить настройки уведомлений' });
  }
};

export const sendAbandonedCartEmail = async (req, res) => {
  try {
    const { cartSessionId } = req.body;
    
    if (!cartSessionId) {
      return res.status(400).json({ error: 'Cart session ID is required' });
    }

    // Get cart session data
    const cartSession = await prisma.cartSession.findUnique({
      where: { sessionId: cartSessionId },
      include: { user: true }
    });

    if (!cartSession) {
      return res.status(404).json({ error: 'Сессия корзины не найдена' });
    }

    if (!cartSession.customerEmail) {
      return res.status(400).json({ error: 'Email покупателя не указан' });
    }

    const result = await emailService.sendAbandonedCartReminder(
      cartSession.customerEmail,
      {
        sessionId: cartSession.sessionId,
        items: cartSession.items || [],
        totalAmount: cartSession.totalAmount || 0,
        createdAt: cartSession.createdAt
      }
    );

    if (result.success) {
      // Mark email as sent
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { 
          emailSent: true,
          emailSentAt: new Date()
        }
      });

      res.json({ success: true, message: 'Email с напоминанием отправлен' });
    } else {
      res.status(500).json({ error: 'Не удалось отправить email: ' + result.error });
    }
  } catch (error) {
    logger.error('Failed to send abandoned cart email', error);
    res.status(500).json({ error: 'Не удалось отправить email с напоминанием' });
  }
};

export const getEmailSettings = async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: [
            'email_host',
            'email_port',
            'email_user',
            'email_secure'
          ]
        }
      }
    });

    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const response = {
      emailHost: settingsMap.email_host || process.env.EMAIL_HOST || 'smtp.gmail.com',
      emailPort: parseInt(settingsMap.email_port) || parseInt(process.env.EMAIL_PORT) || 587,
      emailUser: settingsMap.email_user || process.env.EMAIL_USER || '',
      emailSecure: settingsMap.email_secure === 'true' || process.env.EMAIL_SECURE === 'true'
    };

    // Test connection
    const connectionTest = await emailService.testConnection();
    response.connectionStatus = connectionTest.success ? 'connected' : 'disconnected';
    response.connectionError = connectionTest.error || null;

    res.json(response);
  } catch (error) {
    logger.error('Failed to get email settings', error);
    res.status(500).json({ error: 'Не удалось получить настройки email' });
  }
};

export const updateEmailSettings = async (req, res) => {
  try {
    const { emailHost, emailPort, emailUser, emailPass, emailSecure } = req.body;

    const settings = [
      { key: 'email_host', value: emailHost || 'smtp.gmail.com' },
      { key: 'email_port', value: (emailPort || 587).toString() },
      { key: 'email_user', value: emailUser || '' },
      { key: 'email_secure', value: (emailSecure || false).toString() }
    ];

    // Only update password if provided
    if (emailPass) {
      settings.push({ key: 'email_pass', value: emailPass });
    }

    await Promise.all(
      settings.map(setting => 
        prisma.appSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting
        })
      )
    );

    logger.info('Email settings updated');
    
    res.json({ 
      success: true, 
      message: 'Настройки email обновлены' 
    });
  } catch (error) {
    logger.error('Failed to update email settings', error);
    res.status(500).json({ error: 'Не удалось обновить настройки email' });
  }
};