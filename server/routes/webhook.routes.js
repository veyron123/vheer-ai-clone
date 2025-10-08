import express from 'express';
import { WebSocketServer } from 'ws';
import notificationService from '../services/NotificationService.js';
import { authenticate as authenticateUser, adminAuth } from '../middleware/auth.js';
import axios from 'axios';

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

// WayForPay webhook - DEPRECATED: Use /api/payments/wayforpay/callback instead
// This route is kept for backward compatibility but should not be used
router.post('/wayforpay', async (req, res) => {
  console.log('⚠️ DEPRECATED WAYFORPAY WEBHOOK CALLED');
  console.log('📥 Please use /api/payments/wayforpay/callback instead');
  console.log('📥 WayForPay webhook received:', req.body);

  // Redirect to the proper endpoint
  res.redirect(307, '/api/payments/wayforpay/callback');
});

// Currency conversion rates
const EXCHANGE_RATES = {
  UAH_TO_USD: 41.5, // 1 USD = 41.5 UAH (current approximate rate)
  USD_TO_UAH: 41.5  // 1 UAH = 1/41.5 USD
};

// Function to track Facebook Pixel events server-side
async function trackFacebookPixelEvent(eventName, eventData) {
  try {
    // Get Facebook Pixel ID from environment
    const pixelId = process.env.FACEBOOK_PIXEL_ID || '1306490273852955';

    // Convert currency to USD for Facebook Pixel
    let valueInUSD = eventData.value;
    let originalCurrency = eventData.currency;

    if (originalCurrency === 'UAH' && valueInUSD) {
      valueInUSD = parseFloat(valueInUSD) / EXCHANGE_RATES.UAH_TO_USD;
      valueInUSD = Math.round(valueInUSD * 100) / 100; // Round to 2 decimal places
      originalCurrency = 'USD';

      console.log('💱 Currency converted for Facebook Pixel:', {
        originalValue: eventData.value,
        originalCurrency: eventData.currency,
        convertedValue: valueInUSD,
        newCurrency: originalCurrency
      });
    }

    // Prepare event data
    const pixelData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: 'https://colibrrri.com',
      user_data: {
        client_ip_address: req.ip || req.connection.remoteAddress,
        client_user_agent: req.get('User-Agent')
      },
      custom_data: {
        ...eventData,
        value: valueInUSD,
        currency: originalCurrency
      }
    };

    // Send to Facebook Conversions API
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        data: [pixelData],
        access_token: process.env.FACEBOOK_ACCESS_TOKEN
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Facebook Pixel event tracked:', eventName, {
      originalValue: eventData.value,
      convertedValue: valueInUSD,
      currency: originalCurrency,
      response: response.data
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to track Facebook Pixel event:', error);
    // Don't throw error to avoid breaking payment flow
    return null;
  }
}

// WebSocket setup function (to be called from main server)
export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/admin'
  });

  wss.on('connection', (ws, req) => {
    console.log('� New WebSocket connection');
    
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
