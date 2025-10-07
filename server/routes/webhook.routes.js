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

// WayForPay webhook for payment processing
router.post('/wayforpay', async (req, res) => {
  try {
    console.log('📥 WayForPay webhook received:', req.body);
    
    // Parse WayForPay response
    const {
      orderReference,
      merchantSignature,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode,
      reason,
      email,
      phone,
      createdDate,
      processingDate,
      productName,
      productPrice,
      productCount,
      merchantDomainName
    } = req.body;
    
    // Log payment details
    console.log('💳 Payment details:', {
      orderReference,
      amount,
      currency,
      transactionStatus,
      productName,
      productPrice,
      productCount
    });
    
    // Check if payment was successful
    if (transactionStatus === 'Approved') {
      console.log('✅ Payment successful, tracking conversion');
      
      // Determine if this is a subscription or cart purchase
      const isSubscription = productName && productName.toLowerCase().includes('subscription');
      
      if (isSubscription) {
        // Track subscription conversion with Facebook Pixel
        await trackFacebookPixelEvent('Subscribe', {
          content_name: productName || 'Subscription',
          value: parseFloat(amount) || 1.00,
          currency: currency || 'UAH',
          content_ids: [orderReference],
          content_type: 'subscription',
          predicted_ltv: parseFloat(amount) * 12 || 12.00
        });
        
        console.log('📊 Facebook Pixel: Subscribe tracked with real amount');
      } else {
        // Track purchase conversion with Facebook Pixel
        await trackFacebookPixelEvent('Purchase', {
          content_name: productName || 'Cart Purchase',
          value: parseFloat(amount) || 1.00,
          currency: currency || 'UAH',
          content_ids: productName ? [orderReference] : [],
          content_type: 'product',
          num_items: parseInt(productCount) || 1
        });
        
        console.log('📊 Facebook Pixel: Purchase tracked with real amount');
      }
      
      // Forward to notification service
      await notificationService.notifyPaymentReceived({
        email,
        orderReference,
        amount,
        currency,
        transactionStatus,
        productName
      });
    } else {
      console.log('❌ Payment failed or pending:', transactionStatus, reason);
    }
    
    // Respond to WayForPay
    res.setHeader('Content-Type', 'text/xml');
    res.send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <ws_response>
        <order_reference>${orderReference}</order_reference>
        <status>accept</status>
        <time>${Date.now()}</time>
        <signature>${merchantSignature}</signature>
      </ws_response>
    `);
  } catch (error) {
    console.error('❌ WayForPay webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Function to track Facebook Pixel events server-side
async function trackFacebookPixelEvent(eventName, eventData) {
  try {
    // Get Facebook Pixel ID from environment
    const pixelId = process.env.FACEBOOK_PIXEL_ID || '1306490273852955';
    
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
        ...eventData
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
    
    console.log('✅ Facebook Pixel event tracked:', eventName, response.data);
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