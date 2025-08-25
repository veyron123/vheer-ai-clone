# 🛠️ Mockup Generator Debug Mode

## Что изменено для отладки

### 📍 Файл: `client/src/components/common/InlineMockupGenerator.jsx`

#### ⚡ ВКЛЮЧЕН DEBUG MODE - Мокапы показываются СРАЗУ после загрузки изображения

**Строки 55-68:** Изменена логика автоматического показа мокапа

```javascript
// CURRENT (DEBUG MODE): Мокап появляется немедленно
useEffect(() => {
  if (autoShow && imageUrl && !hasShownAuto) {
    // DEBUG MODE: Показываем мокап сразу после загрузки изображения (для отладки)
    // Закомментировано: setTimeout с задержкой 1000мс для production режима
    // const timer = setTimeout(() => {
    //   setIsVisible(true);
    //   setHasShownAuto(true);
    // }, 1000);
    // return () => clearTimeout(timer);
    
    // IMMEDIATE MOCKUP FOR DEBUG: Показываем мокап немедленно
    setIsVisible(true);
    setHasShownAuto(true);
  }
}, [imageUrl, autoShow, hasShownAuto]);
```

#### 📝 Добавлено логирование для отладки

**Строка 8:** Добавлен console.log для отслеживания получения изображений

```javascript
console.log('🖼️ InlineMockupGenerator received imageUrl:', imageUrl ? 'URL provided' : 'no URL', { autoShow, aspectRatio });
```

## 🔄 Как переключиться обратно на Production режим

### Шаг 1: Восстановить задержку в 1 секунду

В файле `client/src/components/common/InlineMockupGenerator.jsx`, строки 55-68:

```javascript
// PRODUCTION MODE: Верните эту версию
useEffect(() => {
  if (autoShow && imageUrl && !hasShownAuto) {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasShownAuto(true);
    }, 1000); // ← Задержка 1 секунда для красивого появления
    
    return () => clearTimeout(timer);
  }
}, [imageUrl, autoShow, hasShownAuto]);
```

### Шаг 2: Убрать debug логирование (опционально)

Удалить или закомментировать строку 8:

```javascript
// console.log('🖼️ InlineMockupGenerator received imageUrl:', imageUrl ? 'URL provided' : 'no URL', { autoShow, aspectRatio });
```

## 🎯 Различия режимов

| Режим | Задержка показа | Логирование | Назначение |
|-------|----------------|-------------|------------|
| **DEBUG** | 0ms (сразу) | ✅ Включено | Отладка и тестирование |
| **PRODUCTION** | 1000ms | ❌ Отключено | Красивый UX для пользователей |

## ⚙️ Текущий статус

- ✅ **DEBUG MODE АКТИВЕН** - мокапы появляются сразу
- ✅ **Логирование включено** - можно отслеживать в консоли
- ✅ **Предыдущая версия сохранена** - в комментариях
- ✅ **HMR работает** - изменения применяются автоматически

## 🧪 Как тестировать

1. Откройте DevTools (F12) → Console
2. Загрузите любую страницу генерации (Text-to-Image, Style Transfer, etc.)
3. Загрузите изображение или сгенерируйте новое
4. Мокап должен появиться **СРАЗУ** (без задержки в 1 секунду)
5. В консоли увидите: `🖼️ InlineMockupGenerator received imageUrl: URL provided`

---
*Файл создан: 2025-08-25*  
*Для возврата к production режиму следуйте инструкциям выше*