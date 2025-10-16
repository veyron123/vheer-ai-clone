# Kling 2.5 AI Video Generation API

## Обзор

Интеграция модели Kling 2.5 через Kie API для генерации видео из изображений (image-to-video). Модель обеспечивает высококачественную генерацию видео с расширенными возможностями контроля качества и стиля.

## API Endpoints

### Создание задачи генерации

**Endpoint:** `POST https://api.kie.ai/api/v1/jobs/createTask`

**Аутентификация:** Bearer token в заголовке `Authorization`

## Параметры запроса

### Корневые параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `model` | string | Да | Название модели: `"kling/v2-5-turbo-image-to-video-pro"` |
| `callBackUrl` | string | Нет | URL для callback уведомлений |

### Параметры объекта `input`

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `prompt` | string | Да | Текстовое описание для генерации видео (макс. 2500 символов) |
| `image_url` | string | Да | URL изображения для использования как основа видео |
| `duration` | string | Нет | Длительность видео в секундах (`"5"`, `"10"`) |
| `negative_prompt` | string | Нет | Элементы для избежания в видео (макс. 2496 символов) |
| `cfg_scale` | number | Нет | CFG scale для контроля соответствия промпту (0-1, шаг 0.1) |

## Пример запроса

```bash
curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "kling/v2-5-turbo-image-to-video-pro",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
      "prompt": "Astronaut instantly teleports through a glowing magical wooden door. Handheld tracking, camera stays 5–10 meters above and behind, smooth third-person chase. Hyper-realistic base, each scene with distinct art style, instant scene flashes with bright portal glow, high detail, 8K, epic orchestral undertones. High-frame interpolation for smooth motion and sharp instant transitions. Close-up: astronaut in white suit falls rapidly through glowing portal underfoot.\nFirst transition: LEGO Alps, high-saturation daylight, snowy peaks and valleys below, astronaut falls, next portal opens.\nSecond transition: Amazon rainforest, dense canopy and rivers below, astronaut falls, next portal opens.\nThird transition: Ancient Egypt, Giza pyramids in mural style, desert and Nile below, astronaut falls, next portal opens.\nFourth transition: abstract black-and-white ink style, Chinese Great Wall below, astronaut falls, final portal opens.\nFifth transition: New York night, realistic dark skyline, glowing city lights, Empire State Building, astronaut hovers elegantly. Camera maintains constant distance, slight orbit, smooth third-person tracking throughout. Each portal transition is a sharp flash, emphasizing speed and magical journey, abrupt style and location shifts.",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1759211376283gfcw5zcy.png",
      "duration": "5",
      "negative_prompt": "blur, distort, and low quality",
      "cfg_scale": 0.5
    }
  }'
```

## Пример ответа

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678"
  }
}
```

## Получение статуса задачи

**Endpoint:** `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`

**Аутентификация:** Bearer token в заголовке `Authorization`

## Пример ответа статуса

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678",
    "model": "kling/v2-5-turbo-image-to-video-pro",
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-video.mp4\"]}",
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000
  }
}
```

## Статусы задач

- `waiting` - Ожидание генерации
- `queuing` - В очереди
- `generating` - Генерируется
- `success` - Успешно завершено
- `fail` - Ошибка генерации

## Callback уведомления

При указании `callBackUrl` система отправляет POST запросы на указанный URL при завершении задачи.

### Успешный callback

```json
{
    "code": 200,
    "data": {
        "completeTime": 1755599644000,
        "consumeCredits": 100,
        "costTime": 8,
        "createTime": 1755599634000,
        "model": "kling/v2-5-turbo-image-to-video-pro",
        "resultJson": "{\"resultUrls\":[\"https://example.com/generated-video.mp4\"]}",
        "state": "success",
        "taskId": "e989621f54392584b05867f87b160672"
    },
    "msg": "Playground task completed successfully."
}
```

### Callback ошибки

```json
{
    "code": 501,
    "data": {
        "completeTime": 1755597081000,
        "failCode": "500",
        "failMsg": "Internal server error",
        "model": "kling/v2-5-turbo-image-to-video-pro",
        "state": "fail",
        "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8"
    },
    "msg": "Playground task failed."
}
```

## Параметры детально

### prompt (обязательный)
- **Тип:** string
- **Максимальная длина:** 2500 символов
- **Описание:** Детальное описание желаемого видео, включая действия, стиль, настройки камеры и визуальные эффекты

### image_url (обязательный)
- **Тип:** string (URL)
- **Описание:** Публичный URL изображения для использования как основа видео
- **Поддерживаемые форматы:** JPEG, PNG, WebP
- **Максимальный размер:** 10MB

### duration (необязательный)
- **Тип:** string
- **Доступные значения:** `"5"`, `"10"`
- **Описание:** Длительность генерируемого видео в секундах

### negative_prompt (необязательный)
- **Тип:** string
- **Максимальная длина:** 2496 символов
- **Описание:** Элементы, которые следует избегать в генерируемом видео

### cfg_scale (необязательный)
- **Тип:** number
- **Диапазон:** 0-1
- **Шаг:** 0.1
- **Описание:** CFG (Classifier Free Guidance) scale - контроль соответствия промпту

## Важные замечания

- Callback контент идентичен ответу API Query Task
- Поле `param` содержит полные параметры запроса Create Task
- Без `callBackUrl` уведомления отправляться не будут
- Изображения должны быть публично доступны
- Поддерживаемые форматы: JPEG, PNG, WebP
- Максимальный размер изображения: 10MB
- Рекомендуется использовать детальные промпты для лучших результатов

## Примеры промптов

### Простая анимация
```
"A gentle camera zoom into a beautiful landscape with soft lighting and subtle movement"
```

### Сложная сцена
```
"Astronaut explores an alien planet with dynamic lighting, camera follows behind showing the environment, high detail, cinematic quality, smooth movements"
```

### Стилистические эффекты
```
"Black and white film noir style, detective walks through rainy streets, camera tracks steadily, dramatic shadows, high contrast"