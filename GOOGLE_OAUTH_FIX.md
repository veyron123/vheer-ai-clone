# Исправление Google OAuth для localhost

## Проблема
Ошибка "Unauthorized" при авторизации через Google OAuth на localhost. Это происходит из-за несоответствия redirect URI.

## Причина
Google OAuth требует точного совпадения redirect URI. В текущей конфигурации:
- Callback URL в коде: `http://localhost:5000/auth/google/callback`
- Frontend работает на порту: `5184` (не 5178 как в .env)

## Решение

### 1. Добавьте redirect URI в Google Console

Перейдите в [Google Cloud Console](https://console.cloud.google.com/):
1. Выберите ваш проект
2. Перейдите в "APIs & Services" → "Credentials"
3. Найдите OAuth 2.0 Client ID: `973622012474-fer0eiqjcmvb9s2a7mmte8c8tp0dpaeq.apps.googleusercontent.com`
4. Нажмите на него для редактирования
5. В разделе "Authorized redirect URIs" добавьте ВСЕ эти URL:
   - `http://localhost:5000/auth/google/callback`
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5178/auth/google/callback`
   - `http://localhost:5184/auth/google/callback`
   - `http://127.0.0.1:5000/auth/google/callback`
6. Сохраните изменения

### 2. Обновите переменные окружения

В файле `server/.env` обновите FRONTEND_URL на актуальный порт:
```
FRONTEND_URL="http://localhost:5184"
```

### 3. Проверьте Authorized JavaScript origins

В том же OAuth 2.0 Client в Google Console добавьте в "Authorized JavaScript origins":
- `http://localhost:5000`
- `http://localhost:5173`
- `http://localhost:5178`
- `http://localhost:5184`
- `http://127.0.0.1:5000`

### 4. Временное решение для разработки

Если проблема продолжается, используйте dev-login endpoint:
```
GET http://localhost:5000/auth/dev-login
```

### 5. Альтернативное решение - создайте новый OAuth Client

Если у вас нет доступа к текущему OAuth Client:
1. Создайте новый OAuth 2.0 Client ID в Google Console
2. Тип приложения: Web application
3. Добавьте все необходимые redirect URI для localhost
4. Обновите GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env

## Проверка

После внесения изменений:
1. Перезапустите сервер (Ctrl+C и `npm run dev`)
2. Очистите кэш браузера и cookies
3. Попробуйте авторизоваться снова

## Важно!

- Google OAuth изменения могут занять до 5 минут для применения
- Убедитесь, что используете правильный Client ID и Secret
- Проверьте, что OAuth consent screen настроен правильно