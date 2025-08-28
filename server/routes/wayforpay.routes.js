import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  initializePayment,
  handleCallback,
  checkPaymentStatus,
  cancelSubscription,
  initializeCartPayment,
  handleCartCallback
} from '../controllers/wayforpay.controller.js';

const router = Router();

// Initialize payment (requires authentication)
router.post('/init', authenticate, initializePayment);

// Handle WayForPay callback (no auth required - called by WayForPay)
router.post('/callback', handleCallback);

// Check payment status
router.get('/status/:orderId', authenticate, checkPaymentStatus);

// Cancel subscription
router.post('/cancel', authenticate, cancelSubscription);

// === CART PAYMENT ROUTES (One-time payments) ===

// Initialize cart payment (no auth required - allows guest checkout)
router.post('/cart-checkout', initializeCartPayment);

// Handle WayForPay callback for cart payments (no auth required)
router.post('/cart-callback', handleCartCallback);

// Success page for WayForPay redirects (no CORS restrictions)
// Handle both GET and POST requests from WayForPay
const handleSuccess = (req, res) => {
  // Allow any origin for success page
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Get parameters from query (GET) or body (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  
  // Debug: log all received parameters
  console.log('🔍 SUCCESS PAGE - Method:', req.method);
  console.log('🔍 SUCCESS PAGE - All params:', JSON.stringify(params, null, 2));
  console.log('🔍 SUCCESS PAGE - Available keys:', Object.keys(params));
  
  // WayForPay может передавать разные поля статуса в зависимости от типа операции
  const { 
    orderReference, 
    status, 
    transactionStatus, 
    reasonCode,
    authCode,
    // Дополнительные поля которые может передавать WayForPay
    paymentStatus,
    orderStatus,
    merchantTransactionSecureType,
    cardPan,
    paymentSystemTransactionId
  } = params;
  
  // Определяем финальный статус (проверяем все возможные поля)
  const finalStatus = status || transactionStatus || paymentStatus || orderStatus;
  
  console.log('🔍 SUCCESS PAGE - Final status:', finalStatus);
  console.log('🔍 SUCCESS PAGE - Order ref:', orderReference);
  console.log('🔍 SUCCESS PAGE - Reason code:', reasonCode);
  
  // Определяем правильный URL для редиректа
  const redirectUrl = 'https://colibrrri.com/en/';
  
  // WayForPay: Успешный платеж = transactionStatus: "Approved" И reasonCode: "1100" (или без кода)
  const isSuccessful = (finalStatus === 'Approved') && 
    (reasonCode === '1100' || reasonCode === 1100 || !reasonCode || reasonCode === '');
  
  console.log('🔍 SUCCESS PAGE - Is successful:', isSuccessful, '(status:', finalStatus, ', code:', reasonCode, ')');
  
  if (isSuccessful) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Платеж успешен</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .success { color: green; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 30px; }
          .redirect { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="success">✅ Платеж успешно завершен!</div>
        <div class="info">Номер заказа: ${orderReference || 'N/A'}</div>
        <div class="redirect">Переносим вас на главную страницу...</div>
        <script>
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 3000);
        </script>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ошибка платежа</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .error { color: red; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 30px; }
          .redirect { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="error">❌ Ошибка платежа</div>
        <div class="info">Статус: ${finalStatus || 'Неизвестно'}</div>
        <div class="redirect">Переносим вас на главную страницу...</div>
        <script>
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
};

// Register success handler for both GET and POST methods
router.get('/success', handleSuccess);
router.post('/success', handleSuccess);

// Failure page for WayForPay redirects
router.get('/failure', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  const { orderReference, reasonCode } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Платеж отклонен</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .error { color: red; font-size: 24px; margin-bottom: 20px; }
        .info { color: #666; margin-bottom: 30px; }
        .redirect { color: #007bff; }
      </style>
    </head>
    <body>
      <div class="error">❌ Платеж отклонен</div>
      <div class="info">Заказ: ${orderReference || 'N/A'}<br>Код: ${reasonCode || 'N/A'}</div>
      <div class="redirect">Переносим вас на главную страницу...</div>
      <script>
        setTimeout(() => {
          window.location.href = 'https://colibrrri-fullstack.onrender.com';
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

export default router;