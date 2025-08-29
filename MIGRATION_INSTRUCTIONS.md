# 🚀 Инструкция по миграции базы данных Production

## Способ 1: Через Render Dashboard (Рекомендуется)

### Шаг 1: Откройте Render Dashboard
1. Перейдите на https://dashboard.render.com
2. Войдите в свой аккаунт

### Шаг 2: Найдите вашу базу данных
1. В списке сервисов найдите PostgreSQL базу данных:
   - Название: `vheer-db` или `colibrrri-db` или `colibrrri-fullstack`
2. Кликните на неё

### Шаг 3: Откройте Shell или PSQL
1. Перейдите на вкладку **"Shell"** или **"Connect"**
2. Если есть кнопка **"Open Shell"** - нажмите её
3. Или используйте **"PSQL Command"** для подключения

### Шаг 4: Выполните SQL миграцию
Скопируйте и выполните этот SQL запрос:

```sql
ALTER TABLE "colibrrri_subscriptions" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
```

### Шаг 5: Проверьте результат
Выполните проверочный запрос:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'colibrrri_subscriptions'
AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts');
```

Должно вернуть 7 строк с новыми колонками.

## Способ 2: Через локальный скрипт

### Шаг 1: Получите DATABASE_URL
1. В Render Dashboard откройте вашу базу данных
2. Перейдите на вкладку **"Connect"**
3. Скопируйте **"External Database URL"** (начинается с `postgresql://`)

### Шаг 2: Запустите миграцию
```bash
node migrate-prod-direct.js "postgresql://YOUR_DATABASE_URL_HERE"
```

## Способ 3: Через Render Web Terminal

### Шаг 1: Откройте сервис Backend
1. В Render Dashboard найдите сервис `vheer-api` или `colibrrri-backend`
2. Откройте его

### Шаг 2: Откройте Shell
1. Нажмите кнопку **"Shell"** в верхнем меню
2. Дождитесь загрузки терминала

### Шаг 3: Запустите миграцию
```bash
cd server
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    await prisma.\$executeRaw\`
      ALTER TABLE \"colibrrri_subscriptions\" 
      ADD COLUMN IF NOT EXISTS \"isRecurring\" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS \"recurringToken\" TEXT,
      ADD COLUMN IF NOT EXISTS \"recurringMode\" TEXT,
      ADD COLUMN IF NOT EXISTS \"nextPaymentDate\" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS \"lastPaymentDate\" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS \"failedPaymentAttempts\" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS \"maxFailedAttempts\" INTEGER DEFAULT 3;
    \`;
    console.log('✅ Migration successful!');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}

migrate();
"
```

## Проверка после миграции

После выполнения миграции:

1. **Проверьте сайт** - https://colibrrri.com должен работать без ошибок 500
2. **Сделайте тестовый платёж** - проверьте, что платежи проходят успешно
3. **Проверьте логи** - в Render Dashboard посмотрите логи сервиса на наличие ошибок

## Что делает эта миграция?

Добавляет следующие колонки для поддержки рекуррентных платежей:

- `isRecurring` - флаг автоматического продления подписки
- `recurringToken` - токен WayForPay для автоматических платежей
- `recurringMode` - тип подписки (MONTHLY/YEARLY)
- `nextPaymentDate` - дата следующего автоматического платежа
- `lastPaymentDate` - дата последнего успешного платежа
- `failedPaymentAttempts` - счётчик неудачных попыток
- `maxFailedAttempts` - максимальное количество попыток (по умолчанию 3)

## ⚠️ Важно

- Миграция безопасна и может выполняться повторно
- `IF NOT EXISTS` предотвращает ошибки если колонки уже существуют
- Существующие данные не изменяются
- После миграции сервер автоматически начнёт сохранять данные рекуррентных платежей