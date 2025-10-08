# Настройка Render CLI и MCP Server

## Обзор
Этот проект включает два инструмента для работы с Render:
1. **Render MCP Server** - сервер для интеграции с MCP (Model Context Protocol)
2. **Render CLI** - командная строка для управления сервисами Render

## Быстрый старт

### 1. Настройка API ключа

1. Перейдите на [https://dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
2. Создайте новый API ключ
3. Скопируйте ключ в файл `.env.render`:
   ```bash
   RENDER_API_KEY=ваш_ключ_здесь
   ```

### 2. Настройка переменных окружения

В PowerShell выполните:
```powershell
$env:RENDER_API_KEY = "ваш_ключ_здесь"
```

Или загрузите переменные из файла:
```powershell
Get-Content .env.render | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}
```

## Использование Render CLI

### PowerShell версия (рекомендуется)

```powershell
# Показать справку
.\render-cli.ps1 --help

# Показать версию
.\render-cli.ps1 --version

# Показать список сервисов
.\render-cli.ps1 services

# Показать логи сервиса (нужен service ID из предыдущей команды)
.\render-cli.ps1 logs ваш_service_id
```

### Batch версия (альтернатива)

```cmd
REM Показать справку
render-cli.bat --help

REM Показать список сервисов
render-cli.bat services

REM Показать логи сервиса
render-cli.bat logs ваш_service_id
```

## Использование Render MCP Server

MCP сервер уже настроен в файле `.vscode/mcp.json`. Для использования:

1. Убедитесь, что у вас установлен Node.js
2. Установите зависимости:
   ```bash
   npm install @modelcontextprotocol/sdk
   ```
3. Запустите MCP сервер:
   ```bash
   node render-mcp-server.js
   ```

### Доступные инструменты MCP:

- `list_services` - Показать все сервисы
- `list_deploys` - Показать деплойменты сервиса
- `create_deploy` - Создать новый деплой
- `get_deploy_status` - Получить статус деплоймента

## Примеры использования

### Получение списка сервисов

```powershell
.\render-cli.ps1 services
```

Вывод:
```
Fetching services...
Found 3 services:

ID: srv-abcd1234
Name: colibrrri-clone
Type: web_service
Status: live
URL: https://colibrrri-clone.onrender.com
------------------------
...
```

### Получение логов сервиса

```powershell
.\render-cli.ps1 logs srv-abcd1234
```

Вывод:
```
Fetching logs for service srv-abcd1234...
Recent logs:

[2025-01-08 09:15:23] Server started on port 3000
[2025-01-08 09:15:24] Connected to database
[2025-01-08 09:16:01] Processing request: GET /api/images
...
```

## Устранение проблем

### Ошибка "RENDER_API_KEY environment variable not set"
Убедитесь, что переменная окружения установлена:
```powershell
$env:RENDER_API_KEY = "ваш_ключ"
```

### Ошибка сети
Если возникают проблемы с доступом к api.render.com, проверьте:
- Интернет-соединение
- Файрвол и настройки сети
- Корректность API ключа

### Ошибка "Service not found"
Убедитесь, что:
- Сервис существует в вашей учетной записи Render
- API ключ имеет доступ к сервису
- Service ID указан правильно

## Структура файлов

- `render-mcp-server.js` - MCP сервер для Render
- `render-cli.ps1` - PowerShell версия CLI
- `render-cli.bat` - Batch версия CLI
- `.env.render` - Конфигурационный файл с API ключом
- `.vscode/mcp.json` - Конфигурация MCP серверов для VS Code

## Дополнительная информация

- [Документация Render API](https://api-docs.render.com/)
- [Руководство по Render CLI](https://render.com/docs/cli)
- [Создание API ключей](https://render.com/docs/api-keys)
