# 📚 WayForPay API - Полная документация

## 📋 Содержание

1. [Основные методы платежей](#основные-методы-платежей)
2. [Регулярные платежи](#регулярные-платежи)
3. [Верификация карт](#верификация-карт)
4. [Вспомогательные методы](#вспомогательные-методы)
5. [Безопасность и подписи](#безопасность-и-подписи)
6. [Коды ошибок](#коды-ошибок)
7. [Примеры интеграции](#примеры-интеграции)

---

## 🔑 Основная информация

### Учетные данные (КОНФИДЕНЦИАЛЬНО!)
```
Merchant Login: colibrrri_com
Merchant Secret Key: ccd5a7d7ec3063cc8b616a6c90e686da5362c203
Merchant Password: 8086548cb22812c22b606f21ee675a87
```

### Основные URL
- **Платежная страница**: `https://secure.wayforpay.com/pay`
- **API Endpoint**: `https://api.wayforpay.com/api`
- **Регулярные платежи**: `https://api.wayforpay.com/regularApi`
- **Верификация**: `https://secure.wayforpay.com/verify`

---

## 💳 Основные методы платежей

### 1. Purchase - Прием платежа

**URL**: `https://secure.wayforpay.com/pay`  
**Метод**: POST

#### Обязательные параметры:

| Параметр | Описание | Пример |
|----------|----------|--------|
| `merchantAccount` | ID продавца | `colibrrri_com` |
| `merchantDomainName` | Домен сайта | `vheer.com` |
| `merchantSignature` | Подпись запроса | MD5 hash |
| `orderReference` | Уникальный номер заказа | `ORDER_123456` |
| `orderDate` | Дата заказа (timestamp) | `1234567890` |
| `amount` | Сумма | `400` |
| `currency` | Валюта | `UAH` |
| `productName[]` | Массив названий товаров | `["Basic Plan"]` |
| `productPrice[]` | Массив цен | `[400]` |
| `productCount[]` | Массив количества | `[1]` |

#### Дополнительные параметры:

| Параметр | Описание | Значения |
|----------|----------|----------|
| `merchantTransactionType` | Тип транзакции | `AUTO`, `AUTH`, `SALE` |
| `merchantTransactionSecureType` | Тип безопасности | `AUTO` |
| `language` | Язык страницы | `UA`, `EN`, `RU` |
| `returnUrl` | URL возврата | `https://site.com/success` |
| `serviceUrl` | URL для callback | `https://site.com/api/callback` |
| `clientFirstName` | Имя клиента | |
| `clientLastName` | Фамилия клиента | |
| `clientEmail` | Email клиента | |
| `clientPhone` | Телефон клиента | |

#### Пример запроса:
```javascript
{
  "merchantAccount": "colibrrri_com",
  "merchantDomainName": "vheer.com",
  "merchantSignature": "b95932786cbe243a76b014846b63fe92",
  "orderReference": "ORDER_123456",
  "orderDate": 1234567890,
  "amount": 400,
  "currency": "UAH",
  "productName": ["Basic Plan"],
  "productPrice": [400],
  "productCount": [1],
  "language": "UA",
  "returnUrl": "https://vheer.com/payment/success",
  "serviceUrl": "https://vheer.com/api/wayforpay/callback"
}
```

---

### 2. Charge - Платеж с карточными данными (Host-to-Host)

**URL**: `https://api.wayforpay.com/api`  
**Метод**: POST

#### Обязательные параметры:

| Параметр | Описание |
|----------|----------|
| `transactionType` | `CHARGE` |
| `merchantAccount` | ID продавца |
| `merchantDomainName` | Домен сайта |
| `merchantSignature` | Подпись |
| `orderReference` | Номер заказа |
| `orderDate` | Дата заказа |
| `amount` | Сумма |
| `currency` | Валюта |
| `card` | Номер карты (16 цифр) |
| `expMonth` | Месяц истечения (MM) |
| `expYear` | Год истечения (YYYY) |
| `cardCvv` | CVV код |
| `cardHolder` | Имя на карте |
| `clientFirstName` | Имя клиента |
| `clientLastName` | Фамилия клиента |
| `clientEmail` | Email |
| `clientPhone` | Телефон |

#### Альтернатива - использование токена:
```javascript
{
  "transactionType": "CHARGE",
  "merchantAccount": "colibrrri_com",
  "recToken": "токен_карты",
  // ... остальные параметры
}
```

---

### 3. Settle - Списание заблокированной суммы

**URL**: `https://api.wayforpay.com/api`  
**Метод**: POST

Используется для подтверждения транзакции типа `AUTH`.

#### Параметры:
```javascript
{
  "transactionType": "SETTLE",
  "merchantAccount": "colibrrri_com",
  "orderReference": "ORDER_123456",
  "amount": 400,
  "currency": "UAH",
  "merchantSignature": "hash"
}
```

---

### 4. Refund - Возврат платежа

**URL**: `https://api.wayforpay.com/api`  
**Метод**: POST

#### Параметры:
```javascript
{
  "transactionType": "REFUND",
  "merchantAccount": "colibrrri_com",
  "orderReference": "ORDER_123456",
  "amount": 400,
  "currency": "UAH",
  "comment": "Возврат по запросу клиента",
  "merchantSignature": "hash"
}
```

---

### 5. Check Status - Проверка статуса платежа

**URL**: `https://api.wayforpay.com/api`  
**Метод**: POST

#### Параметры:
```javascript
{
  "transactionType": "CHECK_STATUS",
  "merchantAccount": "colibrrri_com",
  "orderReference": "ORDER_123456",
  "merchantSignature": "hash",
  "apiVersion": 1
}
```

#### Ответ:
```javascript
{
  "merchantAccount": "colibrrri_com",
  "orderReference": "ORDER_123456",
  "amount": "400",
  "currency": "UAH",
  "authCode": "123456",
  "cardPan": "41****1234",
  "transactionStatus": "Approved",
  "reasonCode": "1100"
}
```

---

## 🔄 Регулярные платежи

### Создание регулярного платежа

Регулярный платеж создается автоматически при успешной оплате с получением `recToken`.

### Периодичность (`regularMode`):
- `once` - один раз
- `daily` - ежедневно
- `weekly` - еженедельно
- `monthly` - ежемесячно
- `quarterly` - ежеквартально
- `halfyearly` - раз в полгода
- `yearly` - ежегодно

### Управление регулярными платежами

#### 1. STATUS - Проверка статуса
```javascript
{
  "requestType": "STATUS",
  "merchantAccount": "colibrrri_com",
  "merchantPassword": "8086548cb22812c22b606f21ee675a87",
  "orderReference": "ORDER_123456"
}
```

#### 2. SUSPEND - Приостановка
```javascript
{
  "requestType": "SUSPEND",
  "merchantAccount": "colibrrri_com",
  "merchantPassword": "8086548cb22812c22b606f21ee675a87",
  "orderReference": "ORDER_123456"
}
```

#### 3. RESUME - Возобновление
```javascript
{
  "requestType": "RESUME",
  "merchantAccount": "colibrrri_com",
  "merchantPassword": "8086548cb22812c22b606f21ee675a87",
  "orderReference": "ORDER_123456"
}
```

#### 4. REMOVE - Удаление
```javascript
{
  "requestType": "REMOVE",
  "merchantAccount": "colibrrri_com",
  "merchantPassword": "8086548cb22812c22b606f21ee675a87",
  "orderReference": "ORDER_123456"
}
```

#### 5. CHANGE - Изменение параметров
```javascript
{
  "requestType": "CHANGE",
  "merchantAccount": "colibrrri_com",
  "merchantPassword": "8086548cb22812c22b606f21ee675a87",
  "orderReference": "ORDER_123456",
  "regularMode": "monthly",
  "amount": "400",
  "currency": "UAH",
  "dateBegin": "01.01.2025",
  "dateEnd": "31.12.2025"
}
```

---

## ✅ Верификация карт

### Типы верификации:

#### 1. С блокировкой суммы и вводом заблокированной суммы
```javascript
{
  "paymentSystem": "card",
  "verifyType": "confirm"
}
```

#### 2. С блокировкой и 3D Secure
```javascript
{
  "paymentSystem": "card",
  "verifyType": "simple"
}
```

#### 3. Без списания с Lookup кодом
```javascript
{
  "paymentSystem": "lookupCard",
  "verifyType": "confirm"
}
```

#### 4. Без списания и подтверждения
```javascript
{
  "paymentSystem": "lookupCard",
  "verifyType": "simple"
}
```

### Пример запроса верификации:
```javascript
{
  "merchantAccount": "colibrrri_com",
  "merchantDomainName": "vheer.com",
  "merchantSignature": "hash",
  "orderReference": "VERIFY_123456",
  "amount": "0",
  "currency": "UAH",
  "paymentSystem": "card",
  "verifyType": "simple",
  "returnUrl": "https://vheer.com/verify/success",
  "serviceUrl": "https://vheer.com/api/verify/callback"
}
```

---

## 🔐 Безопасность и подписи

### Генерация подписи (merchantSignature)

#### Для Purchase:
```javascript
const crypto = require('crypto');

function generateSignature(data) {
  const secret = 'ccd5a7d7ec3063cc8b616a6c90e686da5362c203';
  
  // Строка для подписи
  const signString = [
    data.merchantAccount,
    data.merchantDomainName,
    data.orderReference,
    data.orderDate,
    data.amount,
    data.currency,
    ...data.productName,
    ...data.productCount,
    ...data.productPrice
  ].join(';');
  
  // Генерация HMAC MD5
  return crypto
    .createHmac('md5', secret)
    .update(signString)
    .digest('hex');
}
```

#### Для CHECK_STATUS:
```javascript
const signString = [
  merchantAccount,
  orderReference
].join(';');
```

#### Для REFUND:
```javascript
const signString = [
  merchantAccount,
  orderReference,
  amount,
  currency
].join(';');
```

### Проверка подписи callback

При получении callback от WayForPay:
```javascript
function verifyCallback(data) {
  const signString = [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode,
    data.cardPan,
    data.transactionStatus,
    data.reasonCode
  ].join(';');
  
  const expectedSignature = crypto
    .createHmac('md5', secret)
    .update(signString)
    .digest('hex');
    
  return data.merchantSignature === expectedSignature;
}
```

---

## 📊 Статусы транзакций

### transactionStatus:
- `InProcessing` - В обработке
- `WaitingAmountConfirm` - Ожидание подтверждения суммы
- `Approved` - Успешно
- `Declined` - Отклонено
- `Refunded` - Возвращено
- `Voided` - Отменено
- `Expired` - Истекло

### reasonCode - Основные коды:
- `1100` - Успешно
- `1101` - Отклонено банком
- `1102` - Недостаточно средств
- `1103` - Карта заблокирована
- `1104` - Истек срок карты
- `1105` - Неверный CVV
- `1120` - 3D Secure недоступен
- `4100` - Технический успех
- `5100` - Ожидание 3DS

---

## 💻 Примеры интеграции

### 1. Простая кнопка оплаты (HTML форма)
```html
<form action="https://secure.wayforpay.com/pay" method="POST">
  <input type="hidden" name="merchantAccount" value="colibrrri_com">
  <input type="hidden" name="merchantDomainName" value="vheer.com">
  <input type="hidden" name="merchantSignature" value="[generated_signature]">
  <input type="hidden" name="orderReference" value="ORDER_123456">
  <input type="hidden" name="orderDate" value="1234567890">
  <input type="hidden" name="amount" value="400">
  <input type="hidden" name="currency" value="UAH">
  <input type="hidden" name="productName[]" value="Basic Plan">
  <input type="hidden" name="productPrice[]" value="400">
  <input type="hidden" name="productCount[]" value="1">
  <button type="submit">Оплатить</button>
</form>
```

### 2. Node.js интеграция
```javascript
const axios = require('axios');
const crypto = require('crypto');

class WayForPayService {
  constructor() {
    this.merchantAccount = 'colibrrri_com';
    this.merchantSecret = 'ccd5a7d7ec3063cc8b616a6c90e686da5362c203';
    this.merchantPassword = '8086548cb22812c22b606f21ee675a87';
  }

  // Инициализация платежа
  async initPayment(orderData) {
    const paymentData = {
      merchantAccount: this.merchantAccount,
      merchantDomainName: 'vheer.com',
      orderReference: orderData.orderId,
      orderDate: Math.floor(Date.now() / 1000),
      amount: orderData.amount,
      currency: 'UAH',
      productName: [orderData.productName],
      productPrice: [orderData.amount],
      productCount: [1],
      returnUrl: 'https://vheer.com/payment/success',
      serviceUrl: 'https://vheer.com/api/wayforpay/callback'
    };

    paymentData.merchantSignature = this.generateSignature(paymentData);
    
    return paymentData;
  }

  // Проверка статуса
  async checkStatus(orderReference) {
    const data = {
      transactionType: 'CHECK_STATUS',
      merchantAccount: this.merchantAccount,
      orderReference: orderReference,
      apiVersion: 1
    };

    const signString = `${this.merchantAccount};${orderReference}`;
    data.merchantSignature = crypto
      .createHmac('md5', this.merchantSecret)
      .update(signString)
      .digest('hex');

    const response = await axios.post('https://api.wayforpay.com/api', data);
    return response.data;
  }

  // Возврат платежа
  async refund(orderReference, amount) {
    const data = {
      transactionType: 'REFUND',
      merchantAccount: this.merchantAccount,
      orderReference: orderReference,
      amount: amount,
      currency: 'UAH',
      comment: 'Customer request',
      apiVersion: 1
    };

    const signString = `${this.merchantAccount};${orderReference};${amount};UAH`;
    data.merchantSignature = crypto
      .createHmac('md5', this.merchantSecret)
      .update(signString)
      .digest('hex');

    const response = await axios.post('https://api.wayforpay.com/api', data);
    return response.data;
  }

  // Обработка callback
  verifyCallback(callbackData) {
    const signString = [
      callbackData.merchantAccount,
      callbackData.orderReference,
      callbackData.amount,
      callbackData.currency,
      callbackData.authCode,
      callbackData.cardPan,
      callbackData.transactionStatus,
      callbackData.reasonCode
    ].join(';');

    const expectedSignature = crypto
      .createHmac('md5', this.merchantSecret)
      .update(signString)
      .digest('hex');

    return callbackData.merchantSignature === expectedSignature;
  }

  // Ответ на callback
  generateCallbackResponse(orderReference, status = 'accept') {
    const time = Math.floor(Date.now() / 1000);
    const signString = `${orderReference};${status};${time}`;
    
    const signature = crypto
      .createHmac('md5', this.merchantSecret)
      .update(signString)
      .digest('hex');

    return {
      orderReference: orderReference,
      status: status,
      time: time,
      signature: signature
    };
  }
}

module.exports = WayForPayService;
```

### 3. Express.js роуты
```javascript
const express = require('express');
const WayForPayService = require('./wayforpay.service');

const router = express.Router();
const wayforpay = new WayForPayService();

// Инициализация платежа
router.post('/payment/init', async (req, res) => {
  const { planId, amount } = req.body;
  
  const orderData = {
    orderId: `ORDER_${Date.now()}`,
    productName: `Plan ${planId}`,
    amount: amount
  };
  
  const paymentData = await wayforpay.initPayment(orderData);
  res.json(paymentData);
});

// Callback от WayForPay
router.post('/wayforpay/callback', async (req, res) => {
  const callbackData = req.body;
  
  // Проверка подписи
  if (!wayforpay.verifyCallback(callbackData)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Обработка платежа
  if (callbackData.transactionStatus === 'Approved') {
    // Обновить статус заказа
    // Активировать подписку
    // Добавить кредиты пользователю
  }
  
  // Отправить ответ WayForPay
  const response = wayforpay.generateCallbackResponse(
    callbackData.orderReference,
    'accept'
  );
  
  res.json(response);
});

// Проверка статуса
router.get('/payment/status/:orderId', async (req, res) => {
  const status = await wayforpay.checkStatus(req.params.orderId);
  res.json(status);
});

// Возврат
router.post('/payment/refund', async (req, res) => {
  const { orderId, amount } = req.body;
  const result = await wayforpay.refund(orderId, amount);
  res.json(result);
});

module.exports = router;
```

---

## 🔧 Тестирование

### Тестовые карты:
- **Успешный платеж**: `4111 1111 1111 1111`
- **Отклонение**: `4111 1111 1111 1112`

### Тестовый режим:
Используйте тестовый merchant account для разработки.

---

## 📝 Чек-лист интеграции

- [ ] Настроить merchant credentials в .env
- [ ] Реализовать генерацию подписи
- [ ] Создать форму/кнопку оплаты
- [ ] Настроить callback endpoint
- [ ] Реализовать проверку подписи callback
- [ ] Обработать успешные платежи
- [ ] Обработать неуспешные платежи
- [ ] Настроить возвраты
- [ ] Добавить проверку статуса
- [ ] Реализовать регулярные платежи (опционально)
- [ ] Настроить верификацию карт (опционально)
- [ ] Протестировать все сценарии

---

## 🆘 Поддержка

**WayForPay Support**:
- Email: support@wayforpay.com
- Документация: https://wiki.wayforpay.com/
- Личный кабинет: https://secure.wayforpay.com/

---

**Последнее обновление**: 2025-08-19
**Версия документации**: 2.0.0