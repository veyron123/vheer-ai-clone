# SORA 2 AI Video Generation API

## Обзор

Интеграция модели SORA 2 через Kie API для генерации видео из изображений (image-to-video). Модель позволяет создавать динамичное видео на основе статичного изображения с использованием текстовых промптов.

## API Endpoints

### Создание задачи генерации

**Endpoint:** `POST https://api.kie.ai/api/v1/jobs/createTask`

**Аутентификация:** Bearer token в заголовке `Authorization`

## Параметры запроса

### Корневые параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `model` | string | Да | Название модели: `"sora-2-pro-image-to-video"` |
| `callBackUrl` | string | Нет | URL для callback уведомлений |

### Параметры объекта `input`

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `prompt` | string | Да | Текстовый промпт описывающий желаемое движение видео (макс. 5000 символов) |
| `image_urls` | array | Да | URL изображения для использования как первый кадр |
| `aspect_ratio` | string | Нет | Соотношение сторон (`"portrait"`, `"landscape"`) |
| `n_frames` | string | Нет | Количество кадров (`"10"`, `"15"`) |
| `size` | string | Нет | Качество (`"standard"`, `"high"`) |
| `remove_watermark` | boolean | Нет | Удаление водяных знаков |

## Пример запроса

```bash
curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "sora-2-pro-image-to-video",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
      "prompt": "Camera gently zooms in on the character while soft particles float around",
      "image_urls": ["https://example.com/input-image.jpg"],
      "aspect_ratio": "landscape",
      "n_frames": "10",
      "size": "standard",
      "remove_watermark": true
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
    "model": "sora-2-pro-image-to-video",
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-video.mp4\"],\"resultWaterMarkUrls\":[\"https://example.com/watermark-video.mp4\"]}",
    "completeTime": 1698765432000,
    "createTime": 1698765400000
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
        "model": "sora-2-pro-image-to-video",
        "resultJson": "{\"resultUrls\":[\"https://example.com/generated-video.mp4\"],\"resultWaterMarkUrls\":[\"https://example.com/watermark-video.mp4\"]}",
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
        "model": "sora-2-pro-image-to-video",
        "state": "fail",
        "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8"
    },
    "msg": "Playground task failed."
}
```

## Важные замечания

- Callback контент идентичен ответу API Query Task
- Поле `param` содержит полные параметры запроса Create Task
- Без `callBackUrl` уведомления отправляться не будут
- Изображения должны быть публично доступны
- Поддерживаемые форматы: JPEG, PNG, WebP
- Максимальный размер изображения: 10MB