import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  initializePayment,
  handleCallback,
  checkPaymentStatus,
  cancelSubscription,
  initializeCartPayment,
  handleCartCallback
} from '../controllers/wayforpay.controller.js';

// Configure multer for memory storage (no file uploads, just form data)
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Initialize payment (requires authentication)
router.post('/init', authenticate, initializePayment);

// Handle WayForPay callback (no auth required - called by WayForPay)  
// Add CORS handling and multipart parsing for WayForPay callbacks
router.post('/callback', (req, res, next) => {
  // Allow WayForPay callbacks from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, upload.none(), handleCallback);

// Check payment status
router.get('/status/:orderId', authenticate, checkPaymentStatus);

// Cancel subscription
router.post('/cancel', authenticate, cancelSubscription);

// === CART PAYMENT ROUTES (One-time payments) ===

// Initialize cart payment (optional auth - supports both guest and user checkout)
// Use a middleware that adds user if token exists but doesn't require it
router.post('/cart-checkout', async (req, res, next) => {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If token exists, try to authenticate but don't fail if invalid
    const token = authHeader.slice(7);
    try {
      const { authenticate } = await import('../middleware/auth.middleware.js');
      // Create a modified authenticate that doesn't fail
      authenticate(req, res, (err) => {
        if (err) {
          // Token invalid, continue as guest
          console.log('Invalid token, continuing as guest');
          req.user = null;
        }
        next();
      });
    } catch (error) {
      // Auth failed, continue as guest
      req.user = null;
      next();
    }
  } else {
    // No token, continue as guest
    req.user = null;
    next();
  }
}, initializeCartPayment);

// Handle WayForPay callback for cart payments (no auth required)
// Add CORS handling and multipart parsing for WayForPay callbacks
router.post('/cart-callback', (req, res, next) => {
  console.log('🔍 CART-CALLBACK - Request received');
  console.log('🔍 CART-CALLBACK - Content-Type:', req.get('content-type'));
  console.log('🔍 CART-CALLBACK - Raw body type:', typeof req.body);
  console.log('🔍 CART-CALLBACK - Body keys:', Object.keys(req.body || {}));
  
  // Allow WayForPay callbacks from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, upload.none(), handleCartCallback);

// Success page for WayForPay redirects (no CORS restrictions)
// Handle both GET and POST requests from WayForPay
const handleSuccess = (req, res) => {
  console.log('🔍 SUCCESS PAGE - Raw request received');
  console.log('🔍 SUCCESS PAGE - Method:', req.method);
  console.log('🔍 SUCCESS PAGE - Content-Type:', req.get('content-type'));
  // Allow any origin for success page
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Get parameters from query (GET) or body (POST)
  // For multipart/form-data, multer will parse it
  let params = {};
  
  if (req.method === 'GET') {
    params = req.query;
  } else if (req.method === 'POST') {
    // Check if multer parsed multipart data
    if (req.body && Object.keys(req.body).length > 0) {
      params = req.body;
      console.log('🔍 SUCCESS PAGE - Multer parsed body:', JSON.stringify(params, null, 2));
    } 
    // If no body params, check query string (WayForPay might send POST with query params)
    else if (req.query && Object.keys(req.query).length > 0) {
      params = req.query;
      console.log('🔍 SUCCESS PAGE - Using query params:', JSON.stringify(params, null, 2));
    }
  }
  
  // Debug: log all received parameters
  console.log('🔍 SUCCESS PAGE - Final params:', JSON.stringify(params, null, 2));
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
  
  // Расширенная проверка статуса WayForPay
  // Из документации: успешный платеж = transactionStatus: "Approved" и reasonCode: "1100"
  // Но также проверяем другие возможные успешные статусы
  const successStatuses = ['Approved', 'Accepted', 'InProcessing', 'WaitingAuthComplete', 'Success', 'Successful'];
  const successCodes = ['1100', 1100, '0', 0, '', null, undefined];
  
  // Если есть transactionStatus - используем его, иначе ищем в других полях
  const checkStatus = finalStatus || status || transactionStatus || paymentStatus || orderStatus;
  const checkCode = reasonCode;
  
  // Логика: если статус успешный, то считаем платеж успешным
  // Если статуса нет, но URL success и нет кода ошибки - тоже успешный
  const statusOk = successStatuses.includes(checkStatus);
  const codeOk = !checkCode || successCodes.includes(checkCode);
  const urlSuccess = req.path.includes('success'); // Если пришли на success URL
  
  // Платеж успешен если:
  // 1. Статус успешный И (код успешный ИЛИ нет кода)
  // 2. ИЛИ пришли на success URL и нет явного кода ошибки
  // 3. ИЛИ пришли на success URL и вообще нет параметров (WayForPay может не передавать параметры при успехе)
  const noParams = Object.keys(params).length === 0;
  const isSuccessful = (statusOk && codeOk) || (urlSuccess && codeOk) || (urlSuccess && noParams);
  
  console.log('🔍 SUCCESS PAGE - Detailed status check:', {
    method: req.method,
    path: req.path,
    finalStatus,
    checkStatus,
    reasonCode: checkCode,
    statusOk,
    codeOk,
    urlSuccess,
    isSuccessful,
    allReceivedParams: params
  });
  
  if (isSuccessful) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .success { color: green; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 30px; }
          .redirect { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="success">✅ Payment completed successfully!</div>
        <div class="info">Order number: ${orderReference || 'N/A'}</div>
        <div class="redirect">Redirecting to the main page...</div>
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
        <title>Payment Error</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .error { color: red; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 30px; }
          .redirect { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="error">❌ Payment Error</div>
        <div class="info">Status: ${finalStatus || 'Unknown'}</div>
        <div class="redirect">Redirecting to the main page...</div>
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
// Use multer for POST to parse multipart/form-data
router.post('/success', upload.none(), handleSuccess);

// Debug endpoint to log what WayForPay sends (temporary)
router.all('/debug-callback', (req, res) => {
  console.log('🔍 DEBUG CALLBACK - Method:', req.method);
  console.log('🔍 DEBUG CALLBACK - Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 DEBUG CALLBACK - Query:', JSON.stringify(req.query, null, 2));
  console.log('🔍 DEBUG CALLBACK - Body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 DEBUG CALLBACK - URL:', req.url);
  console.log('🔍 DEBUG CALLBACK - Path:', req.path);
  
  res.json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    url: req.url,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Temporary logs endpoint to help debug payment issues
router.get('/recent-logs', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  
  // This is a basic endpoint - in production you'd want proper log aggregation
  res.json({
    message: 'Check Render dashboard logs or server console for detailed payment logs',
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Go to dashboard.render.com',
      '2. Find colibrrri-fullstack service', 
      '3. Click on "Logs" tab',
      '4. Look for 🔍 SUCCESS PAGE logs from recent payments'
    ],
    expectedLogPatterns: [
      '🔍 SUCCESS PAGE - Method:',
      '🔍 SUCCESS PAGE - All params:',
      '🔍 SUCCESS PAGE - Detailed status check:'
    ]
  });
});

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
      <title>Payment Declined</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .error { color: red; font-size: 24px; margin-bottom: 20px; }
        .info { color: #666; margin-bottom: 30px; }
        .redirect { color: #007bff; }
      </style>
    </head>
    <body>
      <div class="error">❌ Payment Declined</div>
      <div class="info">Order: ${orderReference || 'N/A'}<br>Code: ${reasonCode || 'N/A'}</div>
      <div class="redirect">Redirecting to the main page...</div>
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