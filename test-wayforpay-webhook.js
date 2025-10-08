import axios from 'axios';

// Test WayForPay webhook
async function testWayForPayWebhook() {
  try {
    console.log('🧪 Тестирование WayForPay webhook...');

    // Тестовые данные успешного платежа
    const testPayload = {
      merchantAccount: 'test_merchant',
      orderReference: 'ORDER_test_user_123456789',
      amount: '1200',
      currency: 'UAH',
      authCode: '123456',
      cardPan: '411111****1111',
      transactionStatus: 'Approved',
      reasonCode: '1100',
      reason: 'Approved',
      email: 'test@example.com',
      phone: '+380501234567',
      createdDate: Math.floor(Date.now() / 1000),
      processingDate: Math.floor(Date.now() / 1000),
      productName: ['PRO план'],
      productPrice: ['1200'],
      productCount: ['1'],
      merchantSignature: 'test_signature'
    };

    console.log('📤 Отправка тестового webhook на:', 'https://colibrrri.com/api/payments/wayforpay/callback');

    const response = await axios.post(
      'https://colibrrri.com/api/payments/wayforpay/callback',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WayForPay-Webhook-Test'
        },
        timeout: 10000
      }
    );

    console.log('📥 Ответ сервера:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

    if (response.status === 200) {
      console.log('✅ Webhook работает корректно!');
    } else {
      console.log('❌ Webhook вернул неожиданный статус');
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования webhook:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Сервер недоступен - проверьте, запущен ли сервер');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 Домен не найден - проверьте URL');
    } else if (error.response?.status === 404) {
      console.log('🔍 Эндпоинт не найден - проверьте маршрут в коде');
    } else if (error.response?.status === 500) {
      console.log('💥 Внутренняя ошибка сервера - проверьте логи сервера');
    }
  }
}

testWayForPayWebhook();
