# SORA 2 Watermark Remover API

## Обзор

Сервис для удаления водяных знаков из видео, созданных моделью SORA 2. Использует Kie API для обработки видео и удаления водяных знаков с сохранением качества оригинального видео.

## API Endpoints

### Создание задачи удаления водяного знака

**Endpoint:** `POST https://api.kie.ai/api/v1/jobs/createTask`

**Аутентификация:** Bearer token в заголовке `Authorization`

## Параметры запроса

### Корневые параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `model` | string | Да | Название модели: `"sora-watermark-remover"` |
| `callBackUrl` | string | Нет | URL для callback уведомлений |

### Параметры объекта `input`

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `video_url` | string | Да | URL видео SORA 2 (должен начинаться с sora.chatgpt.com) |
| | | | Максимальная длина: 500 символов |

## Пример запроса

```bash
curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "sora-watermark-remover",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
      "video_url": "https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f"
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
    "model": "sora-watermark-remover",
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://example.com/clean-video.mp4\"]}",
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000
  }
}
```

## Статусы задач

- `waiting` - Ожидание обработки
- `queuing` - В очереди
- `generating` - Обрабатывается
- `success` - Успешно завершено
- `fail` - Ошибка обработки

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
        "model": "sora-watermark-remover",
        "resultJson": "{\"resultUrls\":[\"https://example.com/clean-video.mp4\"]}",
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
        "model": "sora-watermark-remover",
        "state": "fail",
        "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8"
    },
    "msg": "Playground task failed."
}
```

## Параметры детально

### video_url (обязательный)
- **Тип:** string (URL)
- **Максимальная длина:** 500 символов
- **Требования:** URL должен начинаться с `https://sora.chatgpt.com/`
- **Описание:** Прямая ссылка на видео SORA 2 для обработки

## Требования к видео

### Поддерживаемые источники
- Видео должны быть созданы моделью SORA 2
- Доступны только публичные видео с домена `sora.chatgpt.com`
- Видео должны быть в формате MP4

### Ограничения
- Максимальная длина видео: не ограничена (зависит от тарифа)
- Разрешение: любое (оригинальное разрешение сохраняется)
- Длительность обработки: зависит от длины видео

## Важные замечания

- Callback контент идентичен ответу API Query Task
- Поле `param` содержит полные параметры запроса Create Task
- Без `callBackUrl` уведомления отправляться не будут
- Видео должно быть публично доступно на момент обработки
- URL должен начинаться с `https://sora.chatgpt.com/`
- Обработка может занять от нескольких минут до часа в зависимости от длины видео

## Примеры использования

### Базовое использование
```bash
curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "sora-watermark-remover",
    "input": {
      "video_url": "https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f"
    }
  }'
```

### С callback уведомлением
```bash
curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "sora-watermark-remover",
    "callBackUrl": "https://your-app.com/webhooks/sora-clean",
    "input": {
      "video_url": "https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f"
    }
  }'
```

## Проверка статуса задачи

```bash
curl -X GET "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task_12345678" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Возможные ошибки

### Неверный URL видео
```json
{
  "code": 400,
  "message": "Invalid video URL. Must be from sora.chatgpt.com"
}
```

### Видео не найдено
```json
{
  "code": 404,
  "message": "Video not found or not accessible"
}
```

### Превышен лимит обработки
```json
{
  "code": 429,
  "message": "Processing limit exceeded for current plan"
}
```

## Рекомендации

- Используйте только публичные видео SORA 2
- Убедитесь что видео доступно на момент обработки
- Сохраняйте taskId для отслеживания процесса
- Настройте callback для автоматического получения результатов
- Проверяйте статус задачи если callback не настроен