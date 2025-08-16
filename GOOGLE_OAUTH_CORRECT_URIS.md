# Исправление Google OAuth URIs

## ❌ ПРОБЛЕМА В ВАШЕЙ КОНФИГУРАЦИИ:

В разделе "Authorized redirect URIs" у вас есть неправильные записи БЕЗ полного пути callback.

## ✅ НУЖНО ИСПРАВИТЬ:

### Удалите эти неправильные URIs:
- `http://localhost:5178` 
- `http://localhost:5180`
- `http://localhost:5182`
- `http://localhost:5173` (если есть без /auth/google/callback)

### Добавьте правильные URIs с полным путем:

В разделе **Authorized redirect URIs** должны быть ТОЛЬКО такие записи (с полным путем):

```
http://localhost:5000/auth/google/callback
http://localhost:5173/auth/google/callback
http://localhost:5178/auth/google/callback
http://localhost:5180/auth/google/callback
http://localhost:5182/auth/google/callback
http://localhost:5184/auth/google/callback
http://localhost:5185/auth/google/callback
http://localhost:5186/auth/google/callback
http://127.0.0.1:5000/auth/google/callback
```

## 📝 Как исправить:

1. **Удалите неправильные записи**:
   - Нажмите на крестик (X) рядом с `http://localhost:5178`
   - Нажмите на крестик (X) рядом с `http://localhost:5180`
   - Нажмите на крестик (X) рядом с `http://localhost:5182`
   - Нажмите на крестик (X) рядом с `http://localhost:5173` (если она без /auth/google/callback)

2. **Добавьте правильные записи**:
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5178/auth/google/callback`
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5180/auth/google/callback`
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5182/auth/google/callback`
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5184/auth/google/callback`
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5185/auth/google/callback`
   - Нажмите "+ Add URI"
   - Вставьте: `http://localhost:5186/auth/google/callback`

3. **Добавьте также в Authorized JavaScript origins** (если еще нет):
   - `http://localhost:5184`
   - `http://localhost:5185`
   - `http://localhost:5186`

4. **Сохраните изменения**:
   - Нажмите кнопку "SAVE" внизу страницы

## ⚠️ ВАЖНО:

**Authorized JavaScript origins** - могут быть БЕЗ пути (как у вас сейчас) ✅
**Authorized redirect URIs** - ДОЛЖНЫ быть С ПОЛНЫМ ПУТЕМ `/auth/google/callback` ❗

## После сохранения:

1. Подождите 1-2 минуты
2. Перейдите на http://localhost:5186
3. Попробуйте авторизоваться через Google
4. Должно работать!

## Текущий порт вашего приложения:
Frontend работает на порту: **5186**
Backend работает на порту: **5000**