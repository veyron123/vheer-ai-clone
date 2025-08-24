import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, BellRing, Smartphone, Monitor, MessageSquare, 
  Send, Settings, Check, X, RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import notificationService from '../services/notificationService';

const NotificationSettings = () => {
  const { token } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check if browser notifications are supported and enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Connect to WebSocket for real-time notifications
    connectToNotifications();

    return () => {
      notificationService.disconnect();
    };
  }, []);

  const connectToNotifications = () => {
    setConnecting(true);
    try {
      notificationService.connectWebSocket();
      toast.success('Connected to real-time notifications');
    } catch (error) {
      toast.error('Failed to connect to notifications');
    } finally {
      setConnecting(false);
    }
  };

  const enableBrowserNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      toast.success('Browser notifications enabled!');
    } else {
      toast.error('Browser notifications denied');
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    try {
      // Test browser notification
      if (notificationsEnabled) {
        await notificationService.showNotification(
          '🧪 Test Notification',
          {
            body: 'Admin notification system is working correctly!',
            icon: '/icon-192x192.png',
            tag: 'test-notification'
          }
        );
      }

      // Test server-side notifications (Telegram, webhooks)
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/webhook/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const results = response.data.results;
      
      let message = 'Test notifications sent:\n';
      message += `📱 Browser: ${notificationsEnabled ? '✅' : '❌'}\n`;
      message += `💬 Telegram: ${results.telegram ? '✅' : '❌'}\n`;
      message += `🔗 Webhook: ${results.webhook ? '✅' : '❌'}\n`;
      message += `🔌 WebSocket: ${results.websocket ? '✅' : '❌'}`;

      toast.success(message);
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notifications');
    } finally {
      setTesting(false);
    }
  };

  const NotificationCard = ({ icon: Icon, title, description, enabled, action, actionLabel }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-primary-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Icon className={`w-6 h-6 ${enabled ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            <div className="flex items-center mt-2">
              {enabled ? (
                <span className="flex items-center text-green-600 text-sm">
                  <Check className="w-4 h-4 mr-1" />
                  Enabled
                </span>
              ) : (
                <span className="flex items-center text-gray-500 text-sm">
                  <X className="w-4 h-4 mr-1" />
                  Disabled
                </span>
              )}
            </div>
          </div>
        </div>
        {action && (
          <button
            onClick={action}
            className="btn btn-outline btn-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h2>
        <p className="text-gray-600">Configure how you want to receive admin notifications</p>
      </div>

      {/* Test Notifications */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Test Notifications</h3>
            <p className="text-blue-700 mt-1">Send a test notification to all configured channels</p>
          </div>
          <button
            onClick={sendTestNotification}
            disabled={testing}
            className="btn btn-primary"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {testing ? 'Testing...' : 'Send Test'}
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Notification Channels</h3>
        
        <NotificationCard
          icon={Monitor}
          title="Browser Notifications"
          description="Get real-time notifications in your browser when new subscriptions, users, or payments occur"
          enabled={notificationsEnabled}
          action={!notificationsEnabled ? enableBrowserNotifications : null}
          actionLabel="Enable"
        />

        <NotificationCard
          icon={MessageSquare}
          title="Telegram Bot"
          description="Receive notifications on your mobile device via Telegram bot"
          enabled={telegramConfigured}
        />

        <NotificationCard
          icon={Smartphone}
          title="WebSocket (Real-time)"
          description="Live updates in the admin dashboard without page refresh"
          enabled={!connecting}
          action={connectToNotifications}
          actionLabel={connecting ? 'Connecting...' : 'Reconnect'}
        />
      </div>

      {/* Configuration Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Instructions</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800">🤖 Telegram Bot Setup:</h4>
            <ol className="text-sm text-gray-600 ml-4 mt-2 space-y-1 list-decimal">
              <li>Create a bot by messaging @BotFather on Telegram</li>
              <li>Get your bot token and chat ID</li>
              <li>Add to server .env file: 
                <code className="bg-gray-200 px-2 py-1 rounded ml-1">
                  TELEGRAM_BOT_TOKEN=your_token TELEGRAM_CHAT_ID=your_chat_id
                </code>
              </li>
              <li>Restart the server</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-800">🔗 Webhook Integration:</h4>
            <p className="text-sm text-gray-600 ml-4">
              Set <code className="bg-gray-200 px-2 py-1 rounded">WEBHOOK_URL</code> in .env to send notifications to Discord, Slack, or other services
            </p>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification Types</h3>
          <p className="text-sm text-gray-600 mt-1">Events that trigger notifications</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">💳 New Subscriptions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">👤 New User Registrations</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">💰 Payment Received</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">⚡ High Credit Usage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;