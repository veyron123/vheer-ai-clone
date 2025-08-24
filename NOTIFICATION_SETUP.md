# 🔔 Notification System Setup Guide

Система уведомлений для админ панели с поддержкой браузерных push-уведомлений, Telegram бота и webhooks.

## 🚀 Возможности

### ✅ Уже работает:
- 🖥️ **Браузерные уведомления** - Push notifications в браузере
- 🔄 **Real-time обновления** - WebSocket подключение к админ панели
- ⚡ **Автоматические уведомления** при:
  - 👤 Регистрации новых пользователей
  - 💳 Новых подписках
  - 💰 Получении платежей
  - 🔥 Высоком использовании кредитов

### 📱 Telegram Bot Setup (для уведомлений на телефон):

#### 1. Создать Telegram бота:
1. Открой Telegram и найди **@BotFather**
2. Отправь `/start` и затем `/newbot`
3. Придумай название бота: `VHeer Admin Bot`
4. Придумай username: `vheer_admin_bot` (должен заканчиваться на `_bot`)
5. Скопируй **Bot Token** (например: `1234567890:AABBccDDee-FfGgHhIiJjKkLlMmNn`)

#### 2. Получить Chat ID:
1. Найди своего бота в Telegram и отправь ему `/start`
2. Открой в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Найди свой `chat.id` в ответе (например: `123456789`)

#### 3. Добавить в .env файл сервера:
```env
# Admin Notifications
TELEGRAM_BOT_TOKEN="1234567890:AABBccDDee-FfGgHhIiJjKkLlMmNn"
TELEGRAM_CHAT_ID="123456789"
```

#### 4. Перезапустить сервер
```bash
npm run dev
```

## 🔗 Webhook Integration (для Discord/Slack)

### Discord Webhook:
1. Создай webhook в Discord сервере
2. Скопируй webhook URL
3. Добавь в .env:
```env
WEBHOOK_URL="https://discord.com/api/webhooks/your-webhook-url"
```

### Slack Webhook:
1. Создай Incoming Webhook в Slack
2. Добавь URL в .env:
```env
WEBHOOK_URL="https://hooks.slack.com/services/your-webhook-url"
```

## 🧪 Тестирование

### В админ панели:
1. Перейди в **Admin Panel** → **Notifications**
2. Нажми **"Send Test"** 
3. Проверь все каналы:
   - ✅ Browser notification
   - ✅ Telegram message (если настроен)
   - ✅ Webhook (если настроен)
   - ✅ WebSocket update

## 📋 Типы уведомлений

### 🟢 Автоматические уведомления:
- **👤 New User**: При регистрации нового пользователя
- **💳 New Subscription**: При покупке подписки
- **💰 Payment Received**: При получении платежа
- **⚡ High Usage**: При превышении лимита кредитов (500+/день)

### 📱 Примеры уведомлений:

#### Новый пользователь:
```
👤 New User Registration!

🆔 Username: john_doe
📧 Email: john@example.com
👤 Full Name: John Doe
🔗 Sign-up Method: Google
📅 Registered: 24.08.2025, 12:34

[View in Admin Panel]
```

#### Новая подписка:
```
🎉 New Subscription!

👤 User: John Doe
📧 Email: john@example.com
💳 Plan: PRO
💰 Amount: $29.99
📅 Date: 24.08.2025, 12:34

[View in Admin Panel]
```

## ⚙️ Настройка в коде

### Отправка кастомного уведомления:
```javascript
import notificationService from '../services/NotificationService.js';

// В любом контроллере
await notificationService.sendTelegramNotification(
  '🚨 Custom Alert!\n\nSomething important happened!',
  { silent: false }
);
```

### WebSocket уведомления:
```javascript
// Отправить в админ панель
notificationService.sendToAdminDashboard('custom_event', {
  message: 'Something happened',
  data: { key: 'value' }
});
```

## 🔧 Устранение неполадок

### Telegram не работает:
1. Проверь Bot Token и Chat ID в .env
2. Убедись что бот не заблокирован
3. Отправь боту любое сообщение

### Browser notifications не работают:
1. Проверь разрешения в браузере
2. Протокол должен быть HTTPS (в продакшене)
3. Service Worker должен быть зарегистрирован

### WebSocket отключается:
1. Проверь что сервер запущен
2. WebSocket подключается автоматически при открытии админ панели
3. Переподключение происходит автоматически

## 🛡️ Безопасность

- Bot Token храни в .env файле
- Не коммить токены в Git
- Используй WEBHOOK_SECRET для верификации
- Admin панель доступна только unitradecargo@gmail.com

---

**✨ Готово!** Теперь ты будешь получать уведомления о всех важных событиях в твоем приложении прямо в браузере и на телефон!