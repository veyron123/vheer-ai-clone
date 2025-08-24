import axios from 'axios';

class NotificationService {
  constructor() {
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID; // Your chat ID
    this.webhookUrl = process.env.WEBHOOK_URL; // For external integrations
    this.wsClients = new Set(); // WebSocket clients for real-time notifications
  }

  // Add WebSocket client for real-time notifications
  addWebSocketClient(ws) {
    this.wsClients.add(ws);
    console.log(`📡 Admin WebSocket client connected. Total: ${this.wsClients.size}`);
    
    ws.on('close', () => {
      this.wsClients.delete(ws);
      console.log(`📡 Admin WebSocket client disconnected. Total: ${this.wsClients.size}`);
    });
  }

  // Send real-time notification to admin dashboard
  sendToAdminDashboard(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    
    this.wsClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  // Send Telegram notification
  async sendTelegramNotification(message, options = {}) {
    if (!this.telegramToken || !this.telegramChatId) {
      console.warn('⚠️ Telegram bot not configured');
      return false;
    }

    try {
      const payload = {
        chat_id: this.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        disable_notification: options.silent || false,
        ...options
      };

      const response = await axios.post(
        `https://api.telegram.org/bot${this.telegramToken}/sendMessage`,
        payload
      );

      if (response.data.ok) {
        console.log('📱 Telegram notification sent successfully');
        return true;
      } else {
        console.error('❌ Telegram API error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to send Telegram notification:', error.message);
      return false;
    }
  }

  // Send webhook notification (for integrations like Discord, Slack, etc.)
  async sendWebhook(data) {
    if (!this.webhookUrl) {
      return false;
    }

    try {
      await axios.post(this.webhookUrl, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('🔗 Webhook notification sent');
      return true;
    } catch (error) {
      console.error('❌ Webhook failed:', error.message);
      return false;
    }
  }

  // Notification for new subscription
  async notifyNewSubscription(user, subscription, payment) {
    const message = `
🎉 <b>New Subscription!</b>

👤 <b>User:</b> ${user.fullName || user.username}
📧 <b>Email:</b> ${user.email}
💳 <b>Plan:</b> ${subscription.plan}
💰 <b>Amount:</b> $${payment?.amount || 'N/A'}
📅 <b>Date:</b> ${new Date().toLocaleString()}

<a href="http://localhost:5178/en/admin">View in Admin Panel</a>
    `;

    // Send to all channels
    await Promise.all([
      this.sendTelegramNotification(message.trim()),
      this.sendWebhook({
        type: 'new_subscription',
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          fullName: user.fullName 
        },
        subscription: { 
          plan: subscription.plan,
          status: subscription.status 
        },
        payment: payment ? { amount: payment.amount } : null,
        timestamp: new Date().toISOString()
      })
    ]);

    // Real-time notification to admin dashboard
    this.sendToAdminDashboard('new_subscription', {
      user: { 
        username: user.username, 
        fullName: user.fullName,
        email: user.email 
      },
      plan: subscription.plan,
      amount: payment?.amount
    });
  }

  // Notification for new user registration
  async notifyNewUser(user) {
    const message = `
👤 <b>New User Registration!</b>

🆔 <b>Username:</b> ${user.username}
📧 <b>Email:</b> ${user.email}
👤 <b>Full Name:</b> ${user.fullName || 'Not provided'}
🔗 <b>Sign-up Method:</b> ${user.googleId ? 'Google' : user.facebookId ? 'Facebook' : 'Email'}
📅 <b>Registered:</b> ${new Date().toLocaleString()}

<a href="http://localhost:5178/en/admin">View in Admin Panel</a>
    `;

    await Promise.all([
      this.sendTelegramNotification(message.trim()),
      this.sendWebhook({
        type: 'new_user',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          signupMethod: user.googleId ? 'Google' : user.facebookId ? 'Facebook' : 'Email'
        },
        timestamp: new Date().toISOString()
      })
    ]);

    this.sendToAdminDashboard('new_user', {
      username: user.username,
      email: user.email,
      fullName: user.fullName
    });
  }

  // Notification for payment received
  async notifyPaymentReceived(user, payment) {
    const message = `
💰 <b>Payment Received!</b>

👤 <b>User:</b> ${user.fullName || user.username}
📧 <b>Email:</b> ${user.email}
💵 <b>Amount:</b> $${payment.amount}
💳 <b>Status:</b> ${payment.status}
📅 <b>Date:</b> ${new Date().toLocaleString()}

<a href="http://localhost:5178/en/admin">View in Admin Panel</a>
    `;

    await Promise.all([
      this.sendTelegramNotification(message.trim()),
      this.sendWebhook({
        type: 'payment_received',
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          fullName: user.fullName 
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          currency: payment.currency || 'USD'
        },
        timestamp: new Date().toISOString()
      })
    ]);

    this.sendToAdminDashboard('payment_received', {
      user: { 
        username: user.username, 
        fullName: user.fullName 
      },
      amount: payment.amount,
      plan: 'Premium' // You might want to get this from subscription
    });
  }

  // Notification for high credit usage (daily threshold)
  async notifyHighUsage(user, creditsUsed, threshold = 500) {
    if (creditsUsed < threshold) return;

    const message = `
⚡ <b>High Credit Usage Alert!</b>

👤 <b>User:</b> ${user.fullName || user.username}
📧 <b>Email:</b> ${user.email}
🔥 <b>Credits Used Today:</b> ${creditsUsed}
📊 <b>Remaining Credits:</b> ${user.totalCredits}
📅 <b>Date:</b> ${new Date().toDateString()}

<a href="http://localhost:5178/en/admin">View in Admin Panel</a>
    `;

    await Promise.all([
      this.sendTelegramNotification(message.trim(), { silent: true }),
      this.sendWebhook({
        type: 'high_usage',
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        },
        usage: {
          creditsUsed,
          threshold,
          remaining: user.totalCredits
        },
        timestamp: new Date().toISOString()
      })
    ]);

    this.sendToAdminDashboard('high_usage', {
      user: { username: user.username },
      credits: creditsUsed
    });
  }

  // Test notification (for setup verification)
  async sendTestNotification() {
    const message = `
🧪 <b>Test Notification</b>

✅ Notification system is working correctly!
📅 <b>Time:</b> ${new Date().toLocaleString()}

<a href="http://localhost:5178/en/admin">Admin Panel</a>
    `;

    const results = await Promise.allSettled([
      this.sendTelegramNotification(message.trim()),
      this.sendWebhook({
        type: 'test',
        message: 'Test notification from VHeer Admin',
        timestamp: new Date().toISOString()
      })
    ]);

    this.sendToAdminDashboard('test', {
      message: 'Test notification sent successfully'
    });

    return results;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;