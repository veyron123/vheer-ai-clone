# 🖼️ Cloudinary Setup для Render Deployment

## 📋 Содержание
1. [Создание аккаунта Cloudinary](#1-создание-аккаунта-cloudinary)
2. [Получение API ключей](#2-получение-api-ключей)
3. [Настройка Render Environment Variables](#3-настройка-render-environment-variables)
4. [Проверка интеграции](#4-проверка-интеграции)
5. [Monitoring и Debugging](#5-monitoring-и-debugging)

---

## 1. Создание аккаунта Cloudinary

### Шаг 1: Регистрация
1. Перейдите на [cloudinary.com](https://cloudinary.com)
2. Нажмите **"Start for free"**
3. Заполните форму регистрации
4. Подтвердите email

### Шаг 2: Бесплатный план
✅ **Бесплатный план включает:**
- 25GB хранилища
- 25GB месячного трафика
- 25,000 трансформаций
- CDN по всему миру
- Автоматическая оптимизация

---

## 2. Получение API ключей

### Шаг 1: Dashboard
1. Войдите в [Cloudinary Console](https://console.cloudinary.com)
2. На главной странице найдите раздел **"Account Details"**

### Шаг 2: Копирование данных
Скопируйте следующие данные:

```bash
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz-ABCD
```

### 🔐 Безопасность
⚠️ **ВАЖНО:** Никогда не публикуйте API Secret в коде!

---

## 3. Настройка Render Environment Variables

### Шаг 1: Render Dashboard
1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Выберите ваш Web Service
3. Перейдите в **Environment**

### Шаг 2: Добавление переменных
Добавьте следующие environment variables:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz-ABCD

# Production settings
NODE_ENV=production
SERVER_URL=https://your-service.onrender.com
```

### Шаг 3: Deploy
После добавления переменных нажмите **"Manual Deploy"**

---

## 4. Проверка интеграции

### Шаг 1: Проверка логов
В Render Dashboard проверьте логи при запуске:

```bash
✅ Looking for logs like:
🟢 Cloudinary configured for production storage
```

### Шаг 2: Тест генерации
1. Авторизуйтесь как `@unitradecargo_1755153796918`
2. Сгенерируйте изображение
3. Проверьте "My Images" в профиле

### Шаг 3: Cloudinary Media Library
1. В Cloudinary Console перейдите в **Media Library**
2. Проверьте папку `vheer-ai/generated`
3. Должны появиться загруженные изображения

---

## 5. Monitoring и Debugging

### Cloudinary Usage
В Cloudinary Dashboard:
- **Dashboard > Usage** - статистика использования
- **Media Library** - все загруженные файлы
- **Transformations** - история трансформаций

### Render Logs
В Render Dashboard:
```bash
# Успешная загрузка
📤 Uploading to Cloudinary: generated/uuid.png
✅ Cloudinary upload successful: https://res.cloudinary.com/...

# Ошибки
❌ Cloudinary upload failed: [error details]
```

### Debugging Commands
Для проверки переменных:
```bash
# В Render Shell
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $NODE_ENV
```

---

## 🎯 Структура файлов в Cloudinary

### Папки:
```
vheer-ai/
├── generated/          # Сгенерированные изображения
├── originals/          # Оригинальные загруженные изображения  
└── thumbnails/         # Миниатюры (автогенерируемые)
```

### URL формат:
```
Original: https://res.cloudinary.com/your-cloud/image/upload/vheer-ai/generated/uuid.png
Thumbnail: https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill,q_80,f_webp/vheer-ai/generated/uuid.png
```

---

## 🚀 Преимущества Cloudinary + Render

### Performance
- ✅ **Global CDN** - быстрая загрузка по всему миру
- ✅ **Auto-optimization** - автоматическое сжатие
- ✅ **Format conversion** - WebP для поддерживающих браузеров

### Reliability  
- ✅ **99.95% uptime** SLA
- ✅ **Automatic backup** - файлы не теряются при рестарте Render
- ✅ **Scalability** - автоматическое масштабирование

### Cost Efficiency
- ✅ **Free tier** - 25GB бесплатно
- ✅ **Pay as you grow** - платить только за использование
- ✅ **No server storage** - экономия дискового пространства Render

---

## 🆘 Troubleshooting

### Проблема: "Cloudinary upload failed"
**Решение:**
1. Проверьте API ключи в Render Environment
2. Проверьте квоты в Cloudinary Dashboard
3. Проверьте сетевые настройки

### Проблема: "Images not saving"
**Решение:**
1. Проверьте `NODE_ENV=production` в Render
2. Проверьте логи Render на ошибки
3. Убедитесь что пользователь имеет платную подписку

### Проблема: "Thumbnails not generating"
**Решение:**
1. Cloudinary автоматически генерирует thumbnails через URL
2. Проверьте формат URL в базе данных
3. Проверьте права доступа в Cloudinary

---

## 📞 Поддержка

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Render Docs:** https://render.com/docs
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration

---

## ✅ Checklist при деплое

- [ ] Создан аккаунт Cloudinary
- [ ] Получены API ключи
- [ ] Добавлены environment variables в Render
- [ ] Deployed сервис на Render
- [ ] Проверены логи запуска
- [ ] Протестирована генерация изображений
- [ ] Проверена Media Library в Cloudinary
- [ ] Проверена страница "My Images"

**Готово! 🎉 Ваши изображения теперь сохраняются в облаке!**