// Service Worker для push-уведомлений Vheer

const CACHE_NAME = 'vheer-notifications-v1';

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker устанавливается...');
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker активирован');
  event.waitUntil(self.clients.claim());
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('📬 Получено push-уведомление');
  
  let notificationData = {
    title: 'Vheer - Уведомление',
    body: 'У вас новое уведомление',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: '/admin',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: '🔗 Открыть'
      },
      {
        action: 'dismiss',
        title: '❌ Закрыть'
      }
    ]
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('❌ Ошибка парсинга данных push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Клик по уведомлению:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Определяем URL для открытия
  const data = event.notification.data || {};
  let urlToOpen = data.url || '/admin';

  // Специальные URL для разных типов уведомлений
  if (data.type) {
    switch (data.type) {
      case 'new_order':
        urlToOpen = '/admin?tab=orders';
        break;
      case 'abandoned_cart':
        urlToOpen = '/admin?tab=carts';
        break;
      case 'test':
        urlToOpen = '/admin?tab=notifications';
        break;
      default:
        urlToOpen = '/admin';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Ищем открытую админ-панель
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            // Если admin открыт, фокусируемся на нем и обновляем URL если нужно
            if (client.url !== urlToOpen) {
              return client.navigate ? client.navigate(urlToOpen) : client.focus();
            }
            return client.focus();
          }
        }
        
        // Если админ-панель не открыта, открываем новую вкладку
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('❌ Ошибка открытия окна:', error);
      })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Уведомление закрыто');
  
  // Можно отправить аналитику
  const data = event.notification.data;
  if (data && data.trackingId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'notification_closed',
        trackingId: data.trackingId,
        timestamp: Date.now()
      })
    }).catch(err => console.error('❌ Ошибка отправки аналитики:', err));
  }
});

// Background Sync для офлайн уведомлений
self.addEventListener('sync', (event) => {
  if (event.tag === 'notifications-sync') {
    console.log('🔄 Фоновая синхронизация уведомлений');
    event.waitUntil(syncPendingNotifications());
  }
});

// Синхронизация отложенных уведомлений
async function syncPendingNotifications() {
  try {
    // Проверяем наличие отложенных уведомлений
    const response = await fetch('/api/notifications/pending', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          await self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/android-chrome-192x192.png',
            badge: notification.badge || '/favicon-32x32.png',
            data: notification.data || {},
            requireInteraction: true
          });
        }
        
        console.log(`✅ Показано ${data.notifications.length} отложенных уведомлений`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка синхронизации уведомлений:', error);
  }
}

// Периодическая проверка уведомлений (если поддерживается)
if ('periodicsync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications') {
      console.log('⏰ Периодическая проверка уведомлений');
      event.waitUntil(checkForNewNotifications());
    }
  });
}

// Проверка новых уведомлений
async function checkForNewNotifications() {
  try {
    const response = await fetch('/api/notifications/check', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.hasNewNotifications) {
        // Показываем новые уведомления
        for (const notification of data.notifications) {
          await self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/android-chrome-192x192.png',
            badge: notification.badge || '/favicon-32x32.png',
            data: notification.data || {},
            requireInteraction: true
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка проверки уведомлений:', error);
  }
}

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  console.log('💬 Получено сообщение:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    checkForNewNotifications();
  }
});

console.log('🚀 Service Worker Vheer загружен и готов к работе');