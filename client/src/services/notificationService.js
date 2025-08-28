class NotificationService {
  constructor() {
    this.permission = null;
    this.registration = null;
    this.init();
  }

  async init() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        await this.requestPermission();
      }

      // Register service worker for persistent notifications
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔔 Notification service worker registered');
      } catch (error) {
        console.error('❌ Failed to register service worker:', error);
      }
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.warn('❌ Notification permission denied');
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'admin-notification',
      renotify: true,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        url: options.url || '/en/admin',
        timestamp: Date.now()
      }
    };

    const notificationOptions = { ...defaultOptions, ...options };

    if (this.registration) {
      // Use service worker for persistent notifications
      await this.registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to basic notifications
      new Notification(title, notificationOptions);
    }
  }

  // Admin-specific notification methods
  async notifyNewSubscription(subscriptionData) {
    const { user, plan, amount } = subscriptionData;
    
    await this.showNotification(
      `💳 New ${plan} Subscription!`,
      {
        body: `${user.fullName || user.username} subscribed to ${plan} plan ($${amount})`,
        icon: '/icon-192x192.png',
        tag: 'new-subscription',
        url: '/en/admin'
      }
    );
  }

  async notifyNewUser(userData) {
    const { fullName, username, email } = userData;
    
    await this.showNotification(
      '👤 New User Registration!',
      {
        body: `${fullName || username} (${email}) just registered`,
        icon: '/icon-192x192.png',
        tag: 'new-user',
        url: '/en/admin'
      }
    );
  }

  async notifyPaymentReceived(paymentData) {
    const { user, amount, plan } = paymentData;
    
    await this.showNotification(
      `💰 Payment Received: $${amount}`,
      {
        body: `${user.fullName || user.username} paid for ${plan} plan`,
        icon: '/icon-192x192.png',
        tag: 'payment-received',
        url: '/en/admin'
      }
    );
  }

  async notifyHighUsage(usageData) {
    const { user, credits } = usageData;
    
    await this.showNotification(
      '⚡ High Credit Usage Alert',
      {
        body: `${user.username} used ${credits} credits today`,
        icon: '/icon-192x192.png',
        tag: 'high-usage',
        url: '/en/admin'
      }
    );
  }

  // WebSocket connection for real-time notifications
  connectWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const wsUrl = `${baseUrl.replace('http', 'ws')}/ws/admin`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 Admin WebSocket connected');
      this.ws.send(JSON.stringify({ type: 'subscribe', channel: 'admin' }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 Admin WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'new_subscription':
        this.notifyNewSubscription(data.payload);
        break;
      case 'new_user':
        this.notifyNewUser(data.payload);
        break;
      case 'payment_received':
        this.notifyPaymentReceived(data.payload);
        break;
      case 'high_usage':
        this.notifyHighUsage(data.payload);
        break;
      default:
        console.log('📬 Unknown notification type:', data.type);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;