# Пошаговая настройка Google OAuth для localhost

## Вариант 1: Обновление существующего OAuth Client

### Шаг 1: Откройте Google Cloud Console
1. Перейдите на https://console.cloud.google.com/
2. Войдите в аккаунт, где создан OAuth Client

### Шаг 2: Найдите ваш проект
1. В верхнем меню выберите нужный проект (или создайте новый)
2. Если не знаете какой проект - посмотрите в списке все проекты

### Шаг 3: Перейдите к OAuth настройкам
1. В левом меню нажмите на "☰" (гамбургер меню)
2. Выберите "APIs & Services" → "Credentials"
3. Найдите OAuth 2.0 Client IDs в списке

### Шаг 4: Найдите нужный Client ID
Ищите Client ID: `973622012474-fer0eiqjcmvb9s2a7mmte8c8tp0dpaeq.apps.googleusercontent.com`
- Если найден - нажмите на него для редактирования
- Если не найден - этот Client ID принадлежит другому аккаунту

### Шаг 5: Добавьте Authorized redirect URIs
В поле "Authorized redirect URIs" нажмите "+ ADD URI" и добавьте ВСЕ эти URL:
```
http://localhost:5000/auth/google/callback
http://localhost:5173/auth/google/callback
http://localhost:5178/auth/google/callback
http://localhost:5184/auth/google/callback
http://localhost:5185/auth/google/callback
http://localhost:5186/auth/google/callback
http://127.0.0.1:5000/auth/google/callback
```

### Шаг 6: Добавьте Authorized JavaScript origins
В поле "Authorized JavaScript origins" нажмите "+ ADD URI" и добавьте:
```
http://localhost:5000
http://localhost:5173
http://localhost:5178
http://localhost:5184
http://localhost:5185
http://localhost:5186
http://127.0.0.1:5000
```

### Шаг 7: Сохраните изменения
Нажмите кнопку "SAVE" внизу страницы

---

## Вариант 2: Создание нового OAuth Client (если нет доступа к текущему)

### Шаг 1: Создайте новый проект (если нужно)
1. На https://console.cloud.google.com/
2. Вверху рядом с "Google Cloud" нажмите на выпадающий список проектов
3. Нажмите "NEW PROJECT"
4. Введите название (например, "Vheer Local Dev")
5. Нажмите "CREATE"

### Шаг 2: Включите Google+ API
1. Перейдите в "APIs & Services" → "Library"
2. Найдите "Google+ API" или "Google Identity"
3. Нажмите "ENABLE"

### Шаг 3: Настройте OAuth consent screen
1. Перейдите в "APIs & Services" → "OAuth consent screen"
2. Выберите "External" и нажмите "CREATE"
3. Заполните обязательные поля:
   - App name: Vheer AI
   - User support email: ваш email
   - Developer contact: ваш email
4. Нажмите "SAVE AND CONTINUE"
5. На следующих шагах можно пропустить (SAVE AND CONTINUE)

### Шаг 4: Создайте OAuth 2.0 Client ID
1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Выберите Application type: "Web application"
4. Введите Name: "Vheer Local Development"

### Шаг 5: Добавьте Authorized JavaScript origins
Нажмите "+ ADD URI" и добавьте:
```
http://localhost:5000
http://localhost:5173
http://localhost:5178
http://localhost:5184
http://localhost:5185
http://localhost:5186
http://127.0.0.1:5000
```

### Шаг 6: Добавьте Authorized redirect URIs
Нажмите "+ ADD URI" и добавьте:
```
http://localhost:5000/auth/google/callback
http://localhost:5173/auth/google/callback
http://localhost:5178/auth/google/callback
http://localhost:5184/auth/google/callback
http://localhost:5185/auth/google/callback
http://localhost:5186/auth/google/callback
http://127.0.0.1:auth/google/callback
```

### Шаг 7: Создайте Client
1. Нажмите "CREATE"
2. Появится окно с:
   - Client ID (скопируйте)
   - Client Secret (скопируйте)

### Шаг 8: Обновите .env файл
Откройте `server/.env` и замените:
```
GOOGLE_CLIENT_ID="ваш_новый_client_id"
GOOGLE_CLIENT_SECRET="ваш_новый_client_secret"
```

### Шаг 9: Перезапустите сервер
1. Остановите сервер (Ctrl+C в терминале)
2. Запустите снова: `npm run dev`

---

## Проверка настроек

### Как проверить что все настроено правильно:
1. Откройте http://localhost:5186
2. Нажмите на кнопку "Sign in with Google"
3. Вы должны увидеть страницу выбора Google аккаунта
4. После выбора аккаунта должны вернуться на сайт авторизованными

### Если появляется ошибка "Error 400: redirect_uri_mismatch"
Это означает что URL в настройках Google не совпадает с тем, что отправляет приложение.
В сообщении об ошибке Google покажет какой именно URI он получил - добавьте его в настройки.

### Если появляется "Unauthorized"
1. Проверьте что Client ID и Secret правильные в .env
2. Убедитесь что сервер перезапущен после изменения .env
3. Подождите 5 минут после изменений в Google Console

---

## Частые проблемы и решения

### Проблема: "This app isn't verified"
**Решение**: Нажмите "Advanced" → "Go to Vheer AI (unsafe)" - это нормально для разработки

### Проблема: Порт клиента меняется при каждом запуске
**Решение**: Закройте все процессы на портах 5173-5186 или укажите фиксированный порт в vite.config.js

### Проблема: "Invalid client_id"
**Решение**: Client ID неправильный или относится к другому проекту. Создайте новый OAuth Client.

---

## Контакты для помощи

Если нужна дополнительная помощь:
1. Сделайте скриншот ошибки
2. Скопируйте URL с ошибкой
3. Проверьте консоль браузера (F12) на наличие дополнительных ошибок