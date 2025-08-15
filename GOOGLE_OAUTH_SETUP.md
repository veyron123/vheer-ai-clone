# 🔧 Подробная настройка Google OAuth

## Шаг 1: Создание проекта в Google Cloud Console

### 1.1 Откройте Google Cloud Console
- Перейдите на https://console.cloud.google.com/
- Войдите в свой Google аккаунт

### 1.2 Создайте новый проект (или выберите существующий)
1. **В верхней части страницы** нажмите на выпадающий список с названием проекта
2. **Нажмите "NEW PROJECT"** (Новый проект)
3. **Заполните форму:**
   - Project name: `Vheer AI App` (или любое другое название)
   - Organization: оставьте по умолчанию
4. **Нажмите "CREATE"**
5. **Подождите** создания проекта (1-2 минуты)
6. **Выберите созданный проект** в выпадающем списке

## Шаг 2: Включение Google+ API

### 2.1 Перейдите в API Library
1. **В левом меню** найдите "APIs & Services" → "Library"
2. **Или используйте прямую ссылку:** https://console.cloud.google.com/apis/library

### 2.2 Найдите и включите Google+ API
1. **В поиске** введите "Google+ API"
2. **Нажмите** на "Google+ API" в результатах
3. **Нажмите "ENABLE"** (Включить)
4. **Подождите** активации (30-60 секунд)

## Шаг 3: Настройка OAuth Consent Screen

### 3.1 Перейдите в OAuth consent screen
1. **В левом меню** найдите "APIs & Services" → "OAuth consent screen"
2. **Или используйте прямую ссылку:** https://console.cloud.google.com/apis/credentials/consent

### 3.2 Выберите тип пользователей
- **Выберите "External"** (для тестирования)
- **Нажмите "CREATE"**

### 3.3 Заполните основную информацию
**App information:**
- App name: `Vheer AI Image Generator`
- User support email: `ваш-email@gmail.com`
- App logo: (можно пропустить)

**App domain:**
- Application home page: `http://localhost:5174`
- Application privacy policy link: `http://localhost:5174/privacy` (можно пропустить)
- Application terms of service link: `http://localhost:5174/terms` (можно пропустить)

**Authorized domains:**
- Добавьте: `localhost`

**Developer contact information:**
- Email addresses: `ваш-email@gmail.com`

**Нажмите "SAVE AND CONTINUE"**

### 3.4 Настройте Scopes (области доступа)
1. **Нажмите "ADD OR REMOVE SCOPES"**
2. **Найдите и выберите:**
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. **Нажмите "UPDATE"**
4. **Нажмите "SAVE AND CONTINUE"**

### 3.5 Добавьте тестовых пользователей
1. **Нажмите "ADD USERS"**
2. **Добавьте свой email** для тестирования
3. **Нажмите "SAVE AND CONTINUE"**

### 3.6 Проверьте настройки
- **Проверьте** все введенные данные
- **Нажмите "BACK TO DASHBOARD"**

## Шаг 4: Создание OAuth 2.0 Client ID

### 4.1 Перейдите в Credentials
1. **В левом меню** найдите "APIs & Services" → "Credentials"
2. **Или используйте прямую ссылку:** https://console.cloud.google.com/apis/credentials

### 4.2 Создайте новые credentials
1. **Нажмите "+ CREATE CREDENTIALS"** в верхней части
2. **Выберите "OAuth 2.0 Client IDs"**

### 4.3 Настройте OAuth client
**Application type:**
- **Выберите "Web application"**

**Name:**
- Введите: `Vheer Local Development`

**Authorized JavaScript origins:**
- **Нажмите "ADD URI"**
- **Добавьте:** `http://localhost:5000`
- **Нажмите "ADD URI"** еще раз
- **Добавьте:** `http://localhost:5174`

**Authorized redirect URIs:**
- **Нажмите "ADD URI"**
- **Добавьте:** `http://localhost:5000/auth/google/callback`

**Нажмите "CREATE"**

## Шаг 5: Получение Client ID и Client Secret

### 5.1 Скопируйте credentials
После создания появится модальное окно с:
- **Client ID** (длинная строка, заканчивающаяся на `.googleusercontent.com`)
- **Client Secret** (короткая строка из букв и цифр)

### 5.2 Сохраните credentials
1. **Скопируйте Client ID** и сохраните в безопасном месте
2. **Скопируйте Client Secret** и сохраните в безопасном месте
3. **Можете нажать "DOWNLOAD JSON"** для сохранения файла конфигурации

## Шаг 6: Обновление .env файла

### 6.1 Откройте файл .env
```
C:\Users\Denis\Desktop\Vheer\vheer-clone\server\.env
```

### 6.2 Замените тестовые значения
```env
# Google OAuth (замените на реальные значения)
GOOGLE_CLIENT_ID="ваш-настоящий-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="ваш-настоящий-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/auth/google/callback"
```

**Пример реальных значений:**
```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz"
```

## Шаг 7: Тестирование

### 7.1 Перезапуск сервера
После обновления .env файла сервер автоматически перезапустится.

### 7.2 Проверка OAuth
1. **Откройте:** http://localhost:5174/oauth-test
2. **Нажмите "Test Google OAuth"**
3. **Вы должны быть перенаправлены на Google**
4. **Войдите в Google аккаунт**
5. **Разрешите доступ к данным**
6. **Вернитесь в приложение с успешной авторизацией**

## 🔍 Поиск созданных credentials

Если вы потеряли credentials:

1. **Перейдите в Google Cloud Console**
2. **Выберите ваш проект**
3. **Перейдите в "APIs & Services" → "Credentials"**
4. **Найдите в списке "OAuth 2.0 Client IDs"**
5. **Нажмите на название вашего client**
6. **Client ID виден сразу**
7. **Для Client Secret нажмите "Show" или создайте новый**

## ❗ Важные моменты

1. **Client ID** - это публичная информация, она будет видна в URL
2. **Client Secret** - это приватная информация, храните в секрете
3. **Для продакшена** создайте отдельный OAuth client с HTTPS URL
4. **Тестовые пользователи** - добавьте все email, которые будут тестировать
5. **Домены** - localhost работает только для разработки

## 🆘 Если что-то не работает

### Проверьте:
- ✅ Проект выбран правильно в Google Cloud Console
- ✅ Google+ API включен
- ✅ OAuth consent screen настроен
- ✅ Redirect URI точно совпадает: `http://localhost:5000/auth/google/callback`
- ✅ .env файл обновлен и сервер перезапущен
- ✅ Ваш email добавлен в тестовые пользователи

### Распространенные ошибки:
- **"redirect_uri_mismatch"** - неправильный callback URL
- **"invalid_client"** - неправильный Client ID или Secret
- **"access_blocked"** - email не добавлен в тестовые пользователи
- **"unauthorized_client"** - OAuth consent screen не настроен