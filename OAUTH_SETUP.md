# Настройка OAuth авторизации через Google и Facebook

## 🚀 OAuth интеграция реализована!

✅ **Что уже сделано:**
- Настроена серверная часть с Passport.js
- Добавлены маршруты для Google и Facebook OAuth
- Созданы кнопки авторизации в UI
- Настроена обработка callback'ов
- Обновлена база данных для хранения OAuth ID
- Добавлена страница обработки результатов авторизации

## 📋 Что нужно настроить для работы

### 1. Google OAuth Setup

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Перейдите в "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Настройте OAuth consent screen
6. Создайте OAuth 2.0 Client ID с типом "Web application"
7. Добавьте следующие URL:
   - **Authorized JavaScript origins:** `http://localhost:5000`
   - **Authorized redirect URIs:** `http://localhost:5000/auth/google/callback`

8. Скопируйте Client ID и Client Secret в файл `.env`:
```
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 2. Facebook OAuth Setup

1. Перейдите в [Facebook Developers](https://developers.facebook.com/)
2. Создайте новое приложение
3. Добавьте продукт "Facebook Login"
4. В настройках Facebook Login добавьте Valid OAuth Redirect URI:
   - `http://localhost:5000/auth/facebook/callback`
5. Скопируйте App ID и App Secret в файл `.env`:
```
FACEBOOK_APP_ID="your-actual-facebook-app-id"
FACEBOOK_APP_SECRET="your-actual-facebook-app-secret"
```

### 3. Обновление базы данных

Выполните миграцию для обновления схемы:
```bash
cd server
npx prisma migrate dev --name add-oauth-fields
npx prisma generate
```

## 🔗 Как это работает

### Пользовательский флоу:

1. **Клик на кнопку OAuth** → Перенаправление на `/auth/google` или `/auth/facebook`
2. **Авторизация на сервисе** → Пользователь входит через Google/Facebook
3. **Callback обработка** → Возврат на `/auth/google/callback` или `/auth/facebook/callback`
4. **Создание пользователя** → Автоматическое создание или обновление пользователя
5. **Возврат в приложение** → Перенаправление на `/auth/callback` с токеном
6. **Авторизация в приложении** → Автоматический вход в систему

### Endpoints:

- `GET /auth/google` - Начало авторизации Google
- `GET /auth/google/callback` - Callback от Google
- `GET /auth/facebook` - Начало авторизации Facebook
- `GET /auth/facebook/callback` - Callback от Facebook
- `GET /auth/callback` - Обработка результата в React приложении

## 🎯 Тестирование

Для тестирования:

1. Настройте Google и Facebook Developer приложения
2. Обновите переменные окружения в `.env`
3. Запустите приложение: `npm run dev`
4. Откройте http://localhost:5174/login
5. Нажмите на кнопки "Google" или "Facebook"

## 🔒 Безопасность

- OAuth токены не сохраняются на сервере
- Используется JWT для поддержания сессии
- Все конфиденциальные данные в переменных окружения
- CORS настроен для разрешённых доменов

## 📱 Особенности

- **Автоматическая регистрация:** Новые пользователи создаются автоматически
- **Связывание аккаунтов:** Если email уже существует, добавляется OAuth ID
- **Бонусные кредиты:** 10 бесплатных кредитов при регистрации через OAuth
- **Безопасность:** Все пароли хешируются, OAuth ID уникальны

## 🛠 В продакшене

Для продакшена обновите URL в OAuth приложениях:
- Google: `https://yourdomain.com/auth/google/callback`
- Facebook: `https://yourdomain.com/auth/facebook/callback`
- Frontend: `https://yourdomain.com/auth/callback`