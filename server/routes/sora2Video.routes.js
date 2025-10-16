const express = require('express');
const router = express.Router();
const Sora2VideoController = require('../controllers/sora2Video.controller');
const { authenticateToken } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Создание задачи генерации видео
router.post('/generate', Sora2VideoController.generate);

// Получение статуса задачи
router.get('/status', Sora2VideoController.status);

// Получение доступных опций
router.get('/options', Sora2VideoController.options);

// Webhook для уведомлений от Kie API
router.post('/webhook', async (req, res) => {
  try {
    const Sora2VideoService = require('../services/Sora2VideoService');
    const result = await Sora2VideoService.handleWebhook(req.body);

    res.json(result);
  } catch (error) {
    console.error('SORA 2 Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

export default router;