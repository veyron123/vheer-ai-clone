# Fal.ai Nano-Banana API Documentation

## Overview
**Nano-Banana on Fal.ai** - это мощный AI сервис для редактирования изображений с использованием модели Gemini. Он позволяет редактировать множественные изображения одновременно с помощью текстовых промптов.

**Базовый URL**: `https://fal.run/fal-ai/nano-banana/edit`
**Model ID**: `fal-ai/nano-banana/edit`
**Провайдер**: Fal.ai
**Модель**: Gemini-based editing
**Категория**: image-to-image

---

## 🚀 1. Установка и настройка

### Установка клиента

```bash
npm install --save @fal-ai/client
```

### Настройка API ключа

Установите `FAL_KEY` как переменную окружения:

```bash
export FAL_KEY="YOUR_API_KEY"
```

### Альтернативная настройка API ключа

```javascript
import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});
```

---

## 📝 2. Основное использование

### Простой запрос с автоматическим ожиданием

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana/edit", {
  input: {
    prompt: "make a photo of the man driving the car down the california coastline",
    image_urls: [
      "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", 
      "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
    ]
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});

console.log(result.data);
console.log(result.requestId);
```

---

## ⏳ 3. Очередь запросов (для долгих операций)

### Отправка запроса в очередь

```javascript
import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/nano-banana/edit", {
  input: {
    prompt: "make a photo of the man driving the car down the california coastline",
    image_urls: [
      "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
      "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
    ]
  },
  webhookUrl: "https://optional.webhook.url/for/results", // Опционально
});
```

### Проверка статуса запроса

```javascript
const status = await fal.queue.status("fal-ai/nano-banana/edit", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
```

### Получение результата

```javascript
const result = await fal.queue.result("fal-ai/nano-banana/edit", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});

console.log(result.data);
console.log(result.requestId);
```

---

## 📁 4. Работа с файлами

### Base64 Data URI

```javascript
const result = await fal.subscribe("fal-ai/nano-banana/edit", {
  input: {
    prompt: "enhance this image",
    image_urls: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD..." // Base64 изображение
    ]
  }
});
```

### Загрузка файлов через Fal.ai Storage

```javascript
import { fal } from "@fal-ai/client";

// Загружаем файл
const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);

// Используем загруженный URL
const result = await fal.subscribe("fal-ai/nano-banana/edit", {
  input: {
    prompt: "edit this image",
    image_urls: [url]
  }
});
```

---

## 📋 5. Схема API

### Input Schema

```typescript
interface InputSchema {
  prompt: string;                    // Промпт для редактирования изображений
  image_urls: string[];             // Массив URL изображений для редактирования
  num_images?: number;              // Количество генерируемых изображений (по умолчанию: 1)
  output_format?: "jpeg" | "png";   // Формат выходных изображений (по умолчанию: "jpeg")
  sync_mode?: boolean;              // Если true, изображения возвращаются как Data URI
}
```

### Пример входных данных

```json
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ],
  "num_images": 1,
  "output_format": "jpeg"
}
```

### Output Schema

```typescript
interface OutputSchema {
  images: File[];      // Массив отредактированных изображений
  description: string; // Текстовое описание от Gemini
}

interface File {
  url: string;         // URL где можно скачать файл
  content_type: string;// MIME тип файла
  file_name: string;   // Имя файла
  file_size: number;   // Размер файла в байтах
}
```

### Пример выходных данных

```json
{
  "images": [
    {
      "url": "https://storage.googleapis.com/falserverless/example_outputs/nano-banana-multi-edit-output.png",
      "content_type": "image/png",
      "file_name": "edited_image.png",
      "file_size": 1024000
    }
  ],
  "description": "Here is a photo of the man driving the car down the California coastline."
}
```

---

## 🔒 6. Безопасность

⚠️ **Важно**: При использовании на клиентской стороне (браузер, мобильное приложение), не выставляйте ваш `FAL_KEY` наружу. Используйте серверный прокси для запросов к API.

---

## 💡 7. Преимущества Fal.ai nano-banana

✅ **Множественные изображения**: Редактирование нескольких изображений одновременно  
✅ **Gemini интеграция**: Использует продвинутую модель Gemini  
✅ **Гибкие форматы**: Поддержка JPEG и PNG  
✅ **Data URI**: Поддержка Base64 входных данных  
✅ **Асинхронные операции**: Система очередей для долгих запросов  
✅ **Webhooks**: Поддержка уведомлений о завершении  
✅ **Логирование**: Детальные логи процесса  

---

## 🚀 8. Примеры использования

### Pet Portrait с множественными изображениями

```javascript
const result = await fal.subscribe("fal-ai/nano-banana/edit", {
  input: {
    prompt: "Transform the pet from the first image into a royal portrait in the style of the second image",
    image_urls: [
      "https://example.com/pet-photo.jpg",        // Фото питомца
      "https://example.com/royal-style.jpg"      // Стиль портрета
    ],
    num_images: 1,
    output_format: "png"
  }
});
```

### Редактирование с описанием от Gemini

```javascript
const result = await fal.subscribe("fal-ai/nano-banana/edit", {
  input: {
    prompt: "Make this landscape more dramatic and cinematic",
    image_urls: ["https://example.com/landscape.jpg"]
  }
});

console.log("Edited image:", result.data.images[0].url);
console.log("AI description:", result.data.description);
```

---

## 📞 Интеграция с существующим проектом

Для интеграции с текущим Colibrrri проектом:

1. Установить `@fal-ai/client` пакет
2. Создать новый контроллер `falai.controller.js`
3. Добавить роут `/api/fal-ai/nano-banana/edit`
4. Настроить переменную окружения `FAL_KEY`
5. Реализовать обработку множественных изображений

---

**Документация обновлена:** `{current_date}`  
**Версия API**: Latest  
**Статус**: Production Ready ✅