# 📚 Vheer AI - Полная документация проекта

## 📋 Оглавление
1. [Обзор проекта](#обзор-проекта)
2. [Архитектура системы](#архитектура-системы)
3. [Технологический стек](#технологический-стек)
4. [Структура проекта](#структура-проекта)
5. [Основные функции](#основные-функции)
6. [API документация](#api-документация)
7. [Процесс работы приложения](#процесс-работы-приложения)
8. [Интеграция с AI моделями](#интеграция-с-ai-моделями)
9. [База данных](#база-данных)
10. [Безопасность](#безопасность)
11. [Развертывание](#развертывание)
12. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)

---

## 🎯 Обзор проекта

### Что такое Vheer AI?
Vheer AI - это веб-платформа для преобразования фотографий в художественные изображения в стилях аниме, мультфильмов и других художественных направлений с использованием передовых AI моделей.

### Основные возможности:
- 🎨 **16+ художественных стилей**: Disney, Pixar, Manga, Cyberpunk, Pop Art и другие
- 🤖 **3 AI модели**: Flux Pro (быстрая), Flux Max (качественная), GPT Image (премиум)
- 🖼️ **Гибкие настройки**: Поддержка различных соотношений сторон
- ⚡ **Оптимизированная производительность**: Быстрая генерация и кэширование
- 📱 **Адаптивный дизайн**: Работает на всех устройствах

### Целевая аудитория:
- Художники и дизайнеры
- Контент-создатели
- Маркетологи
- Энтузиасты AI искусства
- Разработчики игр и анимации

---

## 🏗️ Архитектура системы

### Общая архитектура
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │────▶│                 │────▶│                 │
│   Frontend      │     │    Backend      │     │   AI Services   │
│   (React)       │◀────│   (Express)     │◀────│  (APIs)         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Static Files  │     │   PostgreSQL    │     │   Image Storage │
│   (CDN)         │     │   Database      │     │   (ImgBB)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Компоненты системы:

#### 1. Frontend (Client)
- **Технология**: React 18 с Vite
- **UI Framework**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Оптимизации**: Code splitting, lazy loading

#### 2. Backend (Server)
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Authentication**: JWT
- **Rate Limiting**: express-rate-limit
- **CORS**: Настроенный для production/development

#### 3. Внешние сервисы
- **Flux API**: Основная модель генерации
- **GPT Image API**: Премиум генерация
- **ImgBB API**: Хостинг изображений
- **PostgreSQL**: База данных (production)

---

## 💻 Технологический стек

### Frontend технологии:
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "axios": "^1.6.2",
  "zustand": "^4.4.7",
  "react-query": "^3.39.3",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.294.0",
  "react-helmet-async": "^2.0.4"
}
```

### Backend технологии:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "express-rate-limit": "^7.1.5",
  "axios": "^1.6.2",
  "@prisma/client": "^5.7.0"
}
```

---

## 📁 Структура проекта

```
vheer-clone/
│
├── 📂 client/                    # Frontend приложение
│   ├── 📂 public/               # Статические файлы
│   │   ├── robots.txt          # SEO роботы
│   │   ├── sitemap.xml         # Карта сайта
│   │   └── manifest.json       # PWA манифест
│   │
│   ├── 📂 src/
│   │   ├── 📂 components/      # React компоненты
│   │   │   ├── 📂 anime/      # Компоненты генератора
│   │   │   │   ├── ImageUploader.jsx
│   │   │   │   ├── StyleSelector.jsx
│   │   │   │   ├── ModelSelector.jsx
│   │   │   │   ├── AspectRatioSelector.jsx
│   │   │   │   ├── GenerateButton.jsx
│   │   │   │   └── ExampleGallery.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── SEO.jsx
│   │   │
│   │   ├── 📂 pages/           # Страницы приложения
│   │   │   ├── HomePage.jsx
│   │   │   ├── AnimeGeneratorPage.jsx
│   │   │   ├── GalleryPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── 📂 services/        # API сервисы
│   │   │   ├── api.js         # Axios конфигурация
│   │   │   ├── authService.js
│   │   │   └── imageService.js
│   │   │
│   │   ├── 📂 stores/          # Zustand хранилища
│   │   │   ├── authStore.js
│   │   │   └── imageStore.js
│   │   │
│   │   ├── 📂 hooks/           # Кастомные хуки
│   │   │   └── useImageGeneration.js
│   │   │
│   │   ├── 📂 utils/           # Утилиты
│   │   │   ├── imageUtils.js
│   │   │   └── structuredData.js
│   │   │
│   │   ├── 📂 constants/       # Константы
│   │   │   └── anime.constants.js
│   │   │
│   │   └── 📂 config/          # Конфигурация
│   │       ├── api.config.js
│   │       └── seo.config.js
│   │
│   ├── index.html              # Входной HTML
│   ├── package.json            # Зависимости frontend
│   └── vite.config.js          # Конфигурация Vite
│
├── 📂 server/                   # Backend приложение
│   ├── 📂 controllers/         # Контроллеры
│   │   ├── auth.controller.js
│   │   ├── flux.controller.js
│   │   └── gptimage.controller.js
│   │
│   ├── 📂 routes/              # Маршруты API
│   │   ├── auth.routes.js
│   │   ├── flux.routes.js
│   │   ├── gptimage.routes.js
│   │   └── sitemap.routes.js
│   │
│   ├── 📂 middleware/          # Промежуточное ПО
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── index.js                # Точка входа сервера
│   └── package.json            # Зависимости backend
│
├── render.yaml                  # Конфигурация Render
├── package.json                 # Корневые зависимости
├── README.md                    # README проекта
└── .env.example                 # Пример переменных окружения
```

---

## 🎨 Основные функции

### 1. Загрузка изображения
```javascript
// Процесс загрузки:
1. Пользователь выбирает файл
2. Проверка формата (JPG, PNG, WebP)
3. Проверка размера (макс. 10MB)
4. Конвертация в Base64
5. Отображение превью
```

### 2. Выбор стиля
Доступные стили:
- **Disney** - Мультяшный стиль Disney
- **Pixar** - 3D анимация Pixar
- **DC Comics** - Комиксы DC
- **Cyberpunk** - Футуристический стиль
- **Pop Art** - Поп-арт
- **Manga** - Японская манга
- **Fantasy Anime** - Фэнтези аниме
- И другие (всего 16 стилей)

### 3. Выбор AI модели
| Модель | Скорость | Качество | Особенности |
|--------|----------|----------|-------------|
| **Flux Pro** | ⚡ Быстро (5-10 сек) | ⭐⭐⭐⭐ | Оптимальный баланс |
| **Flux Max** | ⏱️ Средне (15-20 сек) | ⭐⭐⭐⭐⭐ | Максимальное качество |
| **GPT Image** | 🐌 Медленно (30-60 сек) | ⭐⭐⭐⭐⭐ | Уникальные результаты |

### 4. Настройка соотношения сторон
- **Match Input** - Автоматическое определение
- **1:1** - Квадрат (1024×1024)
- **16:9** - Ландшафт (1344×768)
- **9:16** - Портрет (768×1344)
- **4:3** - Альбом (1152×896)
- **3:4** - Портрет (896×1152)

### 5. Процесс генерации
```mermaid
graph LR
    A[Загрузка изображения] --> B[Выбор стиля]
    B --> C[Выбор модели]
    C --> D[Настройка параметров]
    D --> E[Отправка на сервер]
    E --> F[Обработка на backend]
    F --> G[Вызов AI API]
    G --> H[Получение результата]
    H --> I[Отображение пользователю]
```

---

## 🔌 API документация

### Базовый URL
```
Development: http://localhost:5000/api
Production: https://vheer-api.onrender.com/api
```

### Эндпоинты

#### 1. Аутентификация

##### POST `/api/auth/register`
Регистрация нового пользователя
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

##### POST `/api/auth/login`
Вход в систему
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### 2. Генерация изображений

##### POST `/api/flux/generate`
Генерация с Flux моделями
```json
Request:
{
  "prompt": "Transform to Disney style",
  "input_image": "base64_encoded_image",
  "style": "disney",
  "model": "flux-pro" // или "flux-max"
}

Response:
{
  "success": true,
  "image": "base64_encoded_result"
}
```

##### POST `/api/gptimage/generate`
Генерация с GPT Image
```json
Request:
{
  "prompt": "Transform to anime style",
  "input_image": "base64_encoded_image",
  "style": "anime",
  "aspectRatio": "16:9"
}

Response:
{
  "success": true,
  "image": "https://generated-image-url.com/result.jpg"
}
```

#### 3. Галерея

##### GET `/api/images`
Получить изображения пользователя
```json
Headers:
{
  "Authorization": "Bearer jwt_token_here"
}

Response:
{
  "success": true,
  "images": [
    {
      "id": "image_id",
      "url": "image_url",
      "style": "disney",
      "createdAt": "2025-01-13T10:00:00Z"
    }
  ]
}
```

##### DELETE `/api/images/:id`
Удалить изображение
```json
Headers:
{
  "Authorization": "Bearer jwt_token_here"
}

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## ⚙️ Процесс работы приложения

### 1. Инициализация
```javascript
// При загрузке приложения:
1. Загрузка конфигурации
2. Инициализация роутера
3. Проверка аутентификации
4. Загрузка пользовательских данных
5. Установка темы и языка
```

### 2. Процесс генерации изображения

#### Шаг 1: Подготовка на клиенте
```javascript
const prepareImage = async (file) => {
  // Валидация файла
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Неподдерживаемый формат');
  }
  
  // Проверка размера
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Файл слишком большой');
  }
  
  // Конвертация в Base64
  const base64 = await fileToBase64(file);
  return base64;
};
```

#### Шаг 2: Отправка на сервер
```javascript
const generateImage = async (imageData) => {
  const response = await api.post('/flux/generate', {
    prompt: generatePrompt(style),
    input_image: imageData,
    style: selectedStyle,
    model: selectedModel
  });
  
  return response.data;
};
```

#### Шаг 3: Обработка на сервере
```javascript
// server/controllers/flux.controller.js
export const generateImage = async (req, res) => {
  const { prompt, input_image, style, model } = req.body;
  
  // Определение параметров
  const steps = model === 'flux-max' ? 50 : 28;
  
  // Вызов Flux API
  const response = await axios.post(FLUX_API_URL, {
    prompt,
    input_image,
    width: 1024,
    height: 1024,
    steps,
    guidance: 30,
    safety_tolerance: 6
  });
  
  // Polling для результата
  const result = await pollForResult(response.data.id);
  
  res.json(result);
};
```

#### Шаг 4: Polling механизм
```javascript
async function pollForResult(requestId) {
  const maxAttempts = 60;
  const pollInterval = 500;
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${API_URL}/get_result?id=${requestId}`);
    
    if (response.data.status === 'Ready') {
      return {
        success: true,
        image: response.data.result.sample
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Generation timeout');
}
```

### 3. Обработка ошибок
```javascript
// Централизованная обработка ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Перенаправление на логин
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      // Rate limiting
      toast.error('Слишком много запросов');
    } else if (error.response?.status >= 500) {
      // Серверная ошибка
      toast.error('Ошибка сервера');
    }
    
    return Promise.reject(error);
  }
);
```

---

## 🤖 Интеграция с AI моделями

### Flux API Integration

#### Конфигурация
```javascript
const FLUX_API_KEY = process.env.FLUX_API_KEY;
const FLUX_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';
```

#### Параметры генерации
| Параметр | Flux Pro | Flux Max | Описание |
|----------|----------|----------|----------|
| steps | 28 | 50 | Количество шагов генерации |
| guidance | 30 | 30 | Сила следования промпту |
| safety_tolerance | 6 | 6 | Уровень фильтрации контента |
| image_prompt_strength | 0.1 | 0.1 | Влияние исходного изображения |

### GPT Image API Integration

#### Конфигурация
```javascript
const GPT_IMAGE_API_KEY = process.env.GPT_IMAGE_API_KEY;
const GPT_IMAGE_API_URL = 'https://api.kie.ai/api/v1/gpt4o-image/generate';
```

#### Особенности
- Требует публичный URL изображения (используем ImgBB)
- Поддерживает только 3 aspect ratio: "1:1", "3:2", "2:3"
- Долгая генерация (до 3 минут)
- Уникальные художественные результаты

#### Маппинг aspect ratio
```javascript
const mapAspectRatio = (ratio) => {
  switch(ratio) {
    case '16:9':
    case '4:3':
      return '3:2'; // landscape
    case '9:16':
    case '3:4':
      return '2:3'; // portrait
    default:
      return '1:1'; // square
  }
};
```

### ImgBB Integration
Используется для загрузки изображений и получения публичных URL для GPT Image API.

```javascript
const uploadToImgBB = async (base64Image) => {
  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  
  const response = await axios.post('https://api.imgbb.com/1/upload', formData);
  return response.data.data.url;
};
```

---

## 🗄️ База данных

### Схема PostgreSQL (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  images    Image[]
}

model Image {
  id          String   @id @default(cuid())
  url         String
  style       String
  model       String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  plan      String   // 'free', 'pro', 'premium'
  status    String   // 'active', 'cancelled', 'expired'
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Миграции
```bash
# Создание миграции
npx prisma migrate dev --name init

# Применение миграций
npx prisma migrate deploy

# Генерация клиента
npx prisma generate
```

---

## 🔐 Безопасность

### 1. Аутентификация
- **JWT токены** с expiration time 7 дней
- **Bcrypt** для хэширования паролей
- **Refresh tokens** для обновления сессии

### 2. Защита API
```javascript
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // макс 100 запросов
  message: 'Too many requests'
});

// CORS настройка
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### 3. Валидация данных
- Проверка типов файлов
- Ограничение размера загрузок
- Санитизация входных данных
- SQL injection защита через Prisma ORM

### 4. Переменные окружения
```env
# Никогда не коммитить в Git!
JWT_SECRET=super_secret_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
FLUX_API_KEY=your_api_key
GPT_IMAGE_API_KEY=your_api_key
IMGBB_API_KEY=your_api_key
```

---

## 🚀 Развертывание

### Локальная разработка
```bash
# Установка зависимостей
npm install
cd server && npm install
cd ../client && npm install

# Запуск в dev режиме
npm run dev
```

### Production на Render

#### 1. Подготовка
- Код загружен на GitHub
- render.yaml настроен
- Переменные окружения готовы

#### 2. Деплой через Render Dashboard
1. Создать Blueprint
2. Подключить GitHub репозиторий
3. Render автоматически создаст:
   - PostgreSQL базу данных
   - Backend сервис
   - Frontend статический сайт

#### 3. Доступные URL после деплоя
- Frontend: https://vheer-client.onrender.com
- Backend: https://vheer-api.onrender.com
- Health: https://vheer-api.onrender.com/api/health

### Docker деплой (альтернатива)
```dockerfile
# Dockerfile для backend
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 5000
CMD ["node", "index.js"]
```

---

## 📊 Мониторинг и обслуживание

### 1. Логирование
```javascript
// Структурированное логирование
console.log('Generation request:', {
  timestamp: new Date().toISOString(),
  userId: req.user?.id,
  model: req.body.model,
  style: req.body.style
});
```

### 2. Метрики производительности
- Время генерации изображения
- Количество запросов в минуту
- Процент успешных генераций
- Использование памяти

### 3. Health Check
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 4. Бэкапы
- Ежедневные бэкапы базы данных
- Хранение генерированных изображений
- Логи последних 30 дней

### 5. Обновления
```bash
# Обновление зависимостей
npm update
npm audit fix

# Обновление AI моделей
# Следить за changelog API провайдеров
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions workflow
```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy
```

---

## 📈 Оптимизация производительности

### Frontend оптимизации
1. **Code splitting** - разделение кода на чанки
2. **Lazy loading** - отложенная загрузка компонентов
3. **Image optimization** - сжатие и WebP формат
4. **Caching** - браузерное кэширование статики
5. **CDN** - использование CDN для статических ресурсов

### Backend оптимизации
1. **Database indexing** - индексы на часто используемые поля
2. **Query optimization** - оптимизация SQL запросов
3. **Caching** - Redis для кэширования результатов
4. **Connection pooling** - пул соединений с БД
5. **Compression** - gzip сжатие ответов

### SEO оптимизации
1. **Meta tags** - полные meta теги для всех страниц
2. **Sitemap.xml** - карта сайта для поисковиков
3. **Robots.txt** - правила для краулеров
4. **Structured data** - JSON-LD разметка
5. **Performance** - Core Web Vitals оптимизация

---

## 🐛 Известные проблемы и решения

### Проблема 1: GPT Image медленная генерация
**Решение**: Показывать прогресс-бар и уведомление о времени ожидания

### Проблема 2: CORS ошибки в development
**Решение**: Правильная настройка proxy в vite.config.js

### Проблема 3: Rate limiting блокирует пользователей
**Решение**: Увеличить лимиты для авторизованных пользователей

### Проблема 4: Большие изображения вызывают ошибки
**Решение**: Сжатие на клиенте перед отправкой

---

## 📞 Поддержка и контакты

### Техническая поддержка
- Email: support@vheer.ai
- GitHub Issues: https://github.com/veyron123/vheer-ai-clone/issues

### Документация
- API Docs: https://vheer-api.onrender.com/docs
- User Guide: https://vheer.ai/guide

### Сообщество
- Discord: https://discord.gg/vheer
- Twitter: @vheerai

---

## 📄 Лицензия

MIT License - свободное использование с указанием авторства.

---

*Последнее обновление: 13 января 2025*