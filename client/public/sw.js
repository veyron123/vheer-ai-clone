// Service Worker for Push Notifications

const CACHE_NAME = 'vheer-admin-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event (for server-sent push notifications)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let options = {
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/en/admin'
    },
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      options = { ...options, ...pushData };
    } catch (error) {
      console.error('❌ Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'New Notification', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus admin page
  const url = event.notification.data?.url || '/en/admin';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Try to find existing admin tab
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new tab if no admin tab found
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync any pending notifications when back online
  try {
    const response = await fetch('/api/admin/pending-notifications');
    const notifications = await response.json();
    
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, notification.options);
    }
  } catch (error) {
    console.error('❌ Failed to sync notifications:', error);
  }
}