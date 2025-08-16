# Минимальная конфигурация Google OAuth

## 🎯 Почему нужно несколько адресов?

### Проблема с динамическими портами:
При каждом запуске Vite (frontend сервер) пытается запуститься на порту 5173, но если он занят - автоматически выбирает следующий свободный порт (5174, 5175, 5176 и т.д.).

В вашем случае сейчас:
- Backend: порт 5000 (фиксированный)
- Frontend: порт 5186 (меняется при каждом запуске)

## ✅ МИНИМАЛЬНО необходимые URIs:

### Для текущей сессии достаточно ТОЛЬКО:

**Authorized redirect URIs:**
```
http://localhost:5000/auth/google/callback
```

**Authorized JavaScript origins:**
```
http://localhost:5000
http://localhost:5186
```

## 📝 Почему только эти?

1. **`http://localhost:5000/auth/google/callback`** - это куда Google отправляет пользователя после авторизации (на backend)
2. **`http://localhost:5000`** - откуда backend делает запросы к Google
3. **`http://localhost:5186`** - откуда frontend может инициировать OAuth (текущий порт)

## 🔧 Решение проблемы с портами:

### Вариант 1: Фиксированный порт для frontend (РЕКОМЕНДУЮ)

Измените `client/vite.config.js`:
```javascript
export default {
  server: {
    port: 5173,  // фиксированный порт
    strictPort: true  // не менять порт если занят
  }
}
```

Тогда нужен только один URL для frontend!

### Вариант 2: Закрыть лишние процессы

Найдите что занимает порты 5173-5185:
```bash
netstat -ano | findstr :5173
taskkill /PID [номер_процесса] /F
```

### Вариант 3: Использовать только backend OAuth

Frontend просто перенаправляет на:
```
http://localhost:5000/auth/google
```
Backend сам обработает всё и вернет пользователя.

## 🎯 ИТОГО - минимальный набор:

Удалите ВСЕ лишние URIs и оставьте только:

**Authorized redirect URIs:**
- `http://localhost:5000/auth/google/callback` (обязательно с /auth/google/callback)

**Authorized JavaScript origins:**
- `http://localhost:5000`
- `http://localhost:5186` (или тот порт, где запущен ваш frontend)

## ❌ Что точно можно удалить:

Из "Authorized redirect URIs" удалите:
- `http://localhost:5178` (неправильный формат - без callback)
- `http://localhost:5180` (неправильный формат - без callback)
- `http://localhost:5182` (неправильный формат - без callback)
- `https://colibrri.com/auth/google/callback` (для продакшн, не нужен сейчас)
- `https://colibrri-fullstack.onrender.com/auth/google/callback` (старый домен)

Оставьте только первый с правильным форматом!