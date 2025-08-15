# API Configuration Guide

## Переключение между локальным и удаленным сервером

Приложение поддерживает работу как с локальным, так и с удаленным сервером.

### Автоматическое переключение

**По умолчанию:**
- `development` режим → использует localhost:5000
- `production` режим → использует https://colibrrri.com

### Ручное переключение

#### Для использования локального сервера в production:

1. **Через переменную окружения:**
```bash
VITE_USE_LOCAL_API=true
```

2. **Через явное указание URL:**
```bash
VITE_API_URL=http://localhost:5000/api
```

#### Примеры конфигураций:

**Development (.env.local):**
```bash
VITE_USE_LOCAL_API=true
VITE_API_URL=http://localhost:5000/api
```

**Production с локальным API (.env.production):**
```bash
VITE_USE_LOCAL_API=true
VITE_API_URL=http://localhost:5000/api
```

**Production с удаленным API (.env.production):**
```bash
VITE_USE_LOCAL_API=false
VITE_API_URL=https://colibrrri.com/api
```

### Где применяется:

- ✅ API вызовы (axios)
- ✅ Генерация изображений (Flux, GPT Image, Midjourney)
- ✅ OAuth авторизация (Google, Facebook)
- ✅ Image-to-Image преобразования

### Проверка конфигурации:

В консоли браузера можно увидеть текущую конфигурацию:
```
Environment check: { MODE: "production", VITE_USE_LOCAL_API: "true", ... }
API Config: { baseURL: "http://localhost:5000/api", ... }
OAuth Config: { googleURL: "http://localhost:5000/auth/google", ... }
```

### Быстрое переключение для разработчиков:

**На локальный сервер:**
```bash
# В .env.local
VITE_USE_LOCAL_API=true
```

**На удаленный сервер:**
```bash
# В .env.local  
VITE_USE_LOCAL_API=false
# или закомментировать/удалить строку
```

После изменения переменных нужно перезапустить dev сервер (`npm run dev`).