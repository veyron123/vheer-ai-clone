import express from 'express';
import { WebSocketServer } from 'ws';
import notificationService from '../services/NotificationService.js';
import { authenticate as authenticateUser, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Test notification endpoint
router.post('/test', authenticateUser, adminAuth, async (req, res) => {
  try {
    const results = await notificationService.sendTestNotification();
    
    const response = {
      telegram: results[0]?.status === 'fulfilled',
      webhook: results[1]?.status === 'fulfilled',
      websocket: true
    };

    res.json({
      message: 'Test notifications sent',
      results: response
    });
  } catch (error) {
    console.error('❌ Test notification failed:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Webhook for external integrations (Discord, Slack, etc.)
router.post('/external', async (req, res) => {
  try {
    const { type, data, secret } = req.body;

    // Verify webhook secret (optional security)
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    console.log('📥 External webhook received:', type, data);

    // Forward to notification service
    switch (type) {
      case 'subscription':
        await notificationService.notifyNewSubscription(
          data.user, 
          data.subscription, 
          data.payment
        );
        break;
      case 'user':
        await notificationService.notifyNewUser(data.user);
        break;
      case 'payment':
        await notificationService.notifyPaymentReceived(
          data.user, 
          data.payment
        );
        break;
      default:
        console.log('❓ Unknown webhook type:', type);
    }

    res.json({ status: 'received' });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// WebSocket setup function (to be called from main server)
export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/admin'
  });

  wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection');
    
    // Add client to notification service
    notificationService.addWebSocketClient(ws);

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📨 WebSocket message received:', message);
        
        if (message.type === 'subscribe' && message.channel === 'admin') {
          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            message: 'Subscribed to admin notifications' 
          }));
        }
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to admin notifications' 
    }));
  });

  return wss;
};

export default router;