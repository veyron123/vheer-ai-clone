# 🔧 Техническая спецификация Vheer AI

## 📊 Технические характеристики

### Системные требования

#### Минимальные требования для разработки:
- **Node.js**: v18.0.0 или выше
- **NPM**: v9.0.0 или выше
- **RAM**: 4GB минимум
- **Disk Space**: 2GB свободного места
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+

#### Production требования:
- **Server**: 2 vCPU, 4GB RAM минимум
- **Database**: PostgreSQL 15+
- **Storage**: 10GB для изображений
- **Bandwidth**: 100GB/месяц минимум
- **SSL**: Обязательный HTTPS

---

## 🎯 Функциональные спецификации

### 1. Загрузка и обработка изображений

#### Входные параметры:
| Параметр | Тип | Ограничения | Описание |
|----------|-----|-------------|----------|
| file | File | Max 10MB | Файл изображения |
| format | string | JPG, PNG, WebP | Поддерживаемые форматы |
| dimensions | object | Min 256x256, Max 4096x4096 | Размеры изображения |

#### Процесс обработки:
```javascript
// 1. Валидация файла
validateFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
}

// 2. Конвертация в Base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 3. Определение aspect ratio
function detectAspectRatio(width, height) {
  const ratio = width / height;
  
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
  if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
  if (Math.abs(ratio - 3/4) < 0.1) return '3:4';
  
  return '1:1'; // default
}
```

### 2. AI модели и их параметры

#### Flux Pro
```json
{
  "model": "flux-kontext-pro",
  "parameters": {
    "steps": 28,
    "guidance": 30,
    "safety_tolerance": 6,
    "interval": 1,
    "image_prompt_strength": 0.1,
    "width": 1024,
    "height": 1024
  },
  "timeout": 30000,
  "polling_interval": 500,
  "max_attempts": 60
}
```

#### Flux Max
```json
{
  "model": "flux-kontext-pro",
  "parameters": {
    "steps": 50,
    "guidance": 30,
    "safety_tolerance": 6,
    "interval": 1,
    "image_prompt_strength": 0.1,
    "width": 1024,
    "height": 1024
  },
  "timeout": 45000,
  "polling_interval": 500,
  "max_attempts": 90
}
```

#### GPT Image
```json
{
  "model": "gpt4o-image",
  "parameters": {
    "size": "1:1", // или "3:2", "2:3"
    "isEnhance": true,
    "uploadCn": false,
    "nVariants": 1,
    "enableFallback": false
  },
  "timeout": 180000,
  "polling_interval": 3000,
  "max_attempts": 60
}
```

### 3. Промпты для стилей

```javascript
const STYLE_PROMPTS = {
  disney: "Transform this image into Disney animation style with vibrant colors, smooth lines, and magical atmosphere",
  pixar: "Convert to Pixar 3D animation style with detailed textures, expressive characters, and cinematic lighting",
  'dc-comics': "Create DC Comics superhero style with bold lines, dramatic shadows, and heroic poses",
  cyberpunk: "Transform into cyberpunk style with neon lights, futuristic elements, and tech noir atmosphere",
  'pop-art': "Convert to pop art style with bold colors, Ben Day dots, and Andy Warhol inspired aesthetics",
  'black-white': "Create black and white comic book style with strong contrast, ink lines, and dramatic shading",
  'bright-realistic': "Enhance with bright realistic style, vivid colors, and photorealistic details",
  fantasy: "Transform into fantasy anime style with magical elements, ethereal lighting, and mystical atmosphere",
  'cartoon-poster': "Create cartoon poster style with bold outlines, flat colors, and graphic design elements",
  inkpunk: "Convert to inkpunk style with ink splatter effects, punk aesthetics, and grunge textures",
  springfield: "Transform into Simpsons Springfield style with yellow skin tones and cartoon features",
  claymation: "Create claymation style with 3D clay texture, stop-motion aesthetics",
  'anime-sketch': "Convert to anime sketch style with pencil lines, manga shading techniques",
  manga: "Transform into classic manga style with black and white tones, screen tones, and expressive eyes",
  'retro-anime': "Create 80s-90s retro anime style with nostalgic colors and classic anime features",
  'neon-punk': "Transform into neon punk style with glowing effects, cyberpunk elements, and rebellious aesthetics"
};
```

---

## 🔄 API Workflow детали

### Flux API Integration Flow
```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant FluxAPI
    participant Polling
    
    Client->>Server: POST /api/flux/generate
    Server->>Server: Validate request
    Server->>FluxAPI: POST generation request
    FluxAPI-->>Server: Return request ID
    
    loop Polling
        Server->>FluxAPI: GET /get_result?id={id}
        FluxAPI-->>Server: Status: Pending/Ready
    end
    
    FluxAPI-->>Server: Status: Ready + Image URL
    Server-->>Client: Return generated image
```

### GPT Image API Flow
```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant ImgBB
    participant GPTImage
    participant Polling
    
    Client->>Server: POST /api/gptimage/generate
    Server->>Server: Check if base64
    Server->>ImgBB: Upload image
    ImgBB-->>Server: Return public URL
    Server->>GPTImage: POST generation request
    GPTImage-->>Server: Return task ID
    
    loop Polling
        Server->>GPTImage: GET /record-info?taskId={id}
        GPTImage-->>Server: Status update
    end
    
    GPTImage-->>Server: Success + Image URL
    Server-->>Client: Return generated image
```

---

## 💾 Состояние приложения

### Zustand Store Structure
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

interface ImageStore {
  uploadedImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  generationTime: number;
  history: GeneratedImage[];
  uploadImage: (file: File) => void;
  generateImage: (params: GenerateParams) => Promise<void>;
  clearImages: () => void;
}

interface UIStore {
  selectedStyle: string;
  selectedModel: string;
  aspectRatio: string;
  isLoading: boolean;
  error: string | null;
  setStyle: (style: string) => void;
  setModel: (model: string) => void;
  setAspectRatio: (ratio: string) => void;
}
```

---

## 🛠️ Конфигурация окружения

### Development (.env.development)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/vheer_dev

# API Keys (Development)
FLUX_API_KEY=dev_key_here
GPT_IMAGE_API_KEY=dev_key_here
IMGBB_API_KEY=dev_key_here

# Security
JWT_SECRET=dev_secret_key_12345

# Client
CORS_ORIGIN=http://localhost:5173
BASE_URL=http://localhost:5000
```

### Production (.env.production)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=${DATABASE_URL}

# API Keys (Production)
FLUX_API_KEY=${FLUX_API_KEY}
GPT_IMAGE_API_KEY=${GPT_IMAGE_API_KEY}
IMGBB_API_KEY=${IMGBB_API_KEY}

# Security
JWT_SECRET=${JWT_SECRET}

# Client
CORS_ORIGIN=https://vheer-client.onrender.com
BASE_URL=https://vheer-api.onrender.com
```

---

## 🔍 Детали реализации

### 1. Обработка ошибок
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Глобальный обработчик ошибок
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;
  
  if (process.env.NODE_ENV === 'production') {
    // Не показывать детали в production
    if (!err.isOperational) {
      statusCode = 500;
      message = 'Something went wrong!';
    }
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### 2. Rate Limiting конфигурация
```javascript
// Разные лимиты для разных эндпоинтов
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // 10 генераций за окно
  message: 'Too many generation requests'
});

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 запросов за окно
  message: 'Too many requests'
});

// Применение
app.use('/api/flux/generate', createLimiter);
app.use('/api/gptimage/generate', createLimiter);
app.use('/api', defaultLimiter);
```

### 3. Кэширование результатов
```javascript
// Simple in-memory cache
class ImageCache {
  constructor(ttl = 3600000) { // 1 час
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

const imageCache = new ImageCache();
```

### 4. Оптимизация изображений
```javascript
// Сжатие изображения перед отправкой
async function compressImage(base64, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Получаем сжатое изображение
      const compressed = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressed.split(',')[1]);
    };
    
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}
```

---

## 📈 Метрики производительности

### Target Metrics
| Метрика | Цель | Текущее | Статус |
|---------|------|---------|--------|
| Time to First Byte (TTFB) | < 200ms | 150ms | ✅ |
| First Contentful Paint (FCP) | < 1.8s | 1.2s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | 2.1s | ✅ |
| Time to Interactive (TTI) | < 3.8s | 3.2s | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.05 | ✅ |
| API Response Time (avg) | < 500ms | 320ms | ✅ |
| Generation Time (Flux Pro) | < 15s | 8s | ✅ |
| Generation Time (Flux Max) | < 30s | 20s | ✅ |
| Generation Time (GPT Image) | < 90s | 60s | ✅ |

### Оптимизации для достижения метрик:
1. **CDN для статики** - CloudFlare/Render CDN
2. **Lazy loading изображений** - Intersection Observer API
3. **Code splitting** - React.lazy() и Suspense
4. **Минификация** - Terser для JS, PostCSS для CSS
5. **Compression** - Brotli/Gzip для текстовых ресурсов
6. **HTTP/2** - Мультиплексирование запросов
7. **Service Worker** - Офлайн кэширование

---

## 🔒 Безопасность - детальная реализация

### 1. Content Security Policy (CSP)
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.bfl.ai", "https://api.kie.ai"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));
```

### 2. Input Sanitization
```javascript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Санитизация HTML
const sanitizeHTML = (dirty) => DOMPurify.sanitize(dirty);

// Валидация email
const validateEmail = (email) => validator.isEmail(email);

// Экранирование SQL (хотя Prisma делает это автоматически)
const escapeSQL = (str) => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
  switch (char) {
    case "\0": return "\\0";
    case "\x08": return "\\b";
    case "\x09": return "\\t";
    case "\x1a": return "\\z";
    case "\n": return "\\n";
    case "\r": return "\\r";
    case "\"":
    case "'":
    case "\\":
    case "%": return "\\" + char;
  }
});
```

### 3. Session Management
```javascript
// JWT Configuration
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: 'vheer.ai',
      audience: 'vheer-users',
      algorithm: 'HS256'
    }
  );
};

// Refresh Token Logic
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};
```

---

## 🧪 Тестирование

### Unit Tests (Jest)
```javascript
describe('Image Generation Service', () => {
  test('should validate image format', () => {
    const validFile = { type: 'image/jpeg', size: 1024 * 1024 };
    expect(() => validateFile(validFile)).not.toThrow();
    
    const invalidFile = { type: 'image/gif', size: 1024 * 1024 };
    expect(() => validateFile(invalidFile)).toThrow('Invalid file type');
  });
  
  test('should detect aspect ratio correctly', () => {
    expect(detectAspectRatio(1024, 1024)).toBe('1:1');
    expect(detectAspectRatio(1920, 1080)).toBe('16:9');
    expect(detectAspectRatio(1080, 1920)).toBe('9:16');
  });
});
```

### Integration Tests
```javascript
describe('API Endpoints', () => {
  test('POST /api/flux/generate', async () => {
    const response = await request(app)
      .post('/api/flux/generate')
      .send({
        prompt: 'Test prompt',
        input_image: 'base64_string',
        style: 'disney',
        model: 'flux-pro'
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('image');
  });
});
```

### E2E Tests (Playwright)
```javascript
test('complete generation flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Upload image
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');
  
  // Select style
  await page.click('[data-style="disney"]');
  
  // Select model
  await page.click('[data-model="flux-pro"]');
  
  // Generate
  await page.click('button:has-text("Generate")');
  
  // Wait for result
  await page.waitForSelector('.generated-image', { timeout: 30000 });
  
  // Verify result
  const image = await page.$('.generated-image');
  expect(image).toBeTruthy();
});
```

---

## 📦 Зависимости и версии

### Critical Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",      // UI Library
    "express": "^4.18.2",     // Backend Framework
    "axios": "^1.6.2",        // HTTP Client
    "prisma": "^5.7.0",       // ORM
    "jsonwebtoken": "^9.0.2", // Authentication
    "bcryptjs": "^2.4.3",     // Password Hashing
    "sharp": "^0.33.0",       // Image Processing
    "helmet": "^7.1.0",       // Security Headers
    "compression": "^1.7.4",  // Response Compression
    "dotenv": "^16.3.1"       // Environment Variables
  }
}
```

### Обновление зависимостей
```bash
# Проверка устаревших пакетов
npm outdated

# Обновление до последних patch версий
npm update

# Обновление до последних minor версий
npm install package@latest

# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix
```

---

## 🚦 Мониторинг и алерты

### Что мониторить:
1. **Uptime** - доступность сервисов
2. **Response Time** - время ответа API
3. **Error Rate** - процент ошибок
4. **CPU/Memory Usage** - использование ресурсов
5. **Database Connections** - активные подключения к БД
6. **API Quota** - использование лимитов AI API
7. **Storage Usage** - использование дискового пространства

### Настройка алертов:
```javascript
// Пример интеграции с monitoring service
const monitor = {
  trackEvent: (name, data) => {
    // Send to monitoring service
    console.log(`Event: ${name}`, data);
  },
  
  trackError: (error, context) => {
    // Send to error tracking
    console.error(`Error in ${context}:`, error);
  },
  
  trackMetric: (name, value) => {
    // Send metric
    console.log(`Metric ${name}: ${value}`);
  }
};

// Использование
monitor.trackEvent('generation_started', { model, style });
monitor.trackMetric('generation_time', Date.now() - startTime);
monitor.trackError(error, 'image_generation');
```

---

*Техническая спецификация v1.0.0 - Последнее обновление: 13 января 2025*