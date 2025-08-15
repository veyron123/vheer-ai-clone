import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import CreditService from '../services/creditService.js';
import CreditCronJob from '../jobs/creditCronJob.js';

const router = Router();

// Получить информацию о кредитах пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    const userCredits = await CreditService.getUserCredits(req.user.id);
    res.json(userCredits);
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ error: 'Failed to get user credits' });
  }
});

// Получить историю транзакций кредитов
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await CreditService.getCreditHistory(req.user.id, limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({ error: 'Failed to get credit history' });
  }
});

// Ручное начисление ежедневных кредитов (для тестирования)
router.post('/claim-daily', authenticate, async (req, res) => {
  try {
    const result = await CreditService.addDailyCredits(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error claiming daily credits:', error);
    res.status(500).json({ error: 'Failed to claim daily credits' });
  }
});

// Административные эндпоинты (только для разработки)
if (process.env.NODE_ENV === 'development') {
  // Ручной запуск начисления кредитов для всех пользователей
  router.post('/admin/run-daily-credits', async (req, res) => {
    try {
      const result = await CreditCronJob.runManually();
      res.json({
        message: 'Daily credits job executed successfully',
        result
      });
    } catch (error) {
      console.error('Error running daily credits manually:', error);
      res.status(500).json({ error: 'Failed to run daily credits job' });
    }
  });

  // Получить информацию о следующем запуске cron job
  router.get('/admin/cron-info', (req, res) => {
    try {
      const cronInfo = CreditCronJob.getNextRunInfo();
      res.json(cronInfo);
    } catch (error) {
      console.error('Error getting cron info:', error);
      res.status(500).json({ error: 'Failed to get cron info' });
    }
  });

  // Добавить кредиты пользователю (только для тестирования)
  router.post('/admin/add-credits/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Используем Prisma напрямую для добавления кредитов
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          totalCredits: {
            increment: amount
          }
        }
      });

      // Записываем транзакцию
      await prisma.credit.create({
        data: {
          userId: userId,
          amount: amount,
          type: 'ADMIN_ADD',
          description: description || 'Admin credit addition'
        }
      });

      res.json({
        message: 'Credits added successfully',
        newTotal: user.totalCredits,
        added: amount
      });
    } catch (error) {
      console.error('Error adding credits:', error);
      res.status(500).json({ error: 'Failed to add credits' });
    }
  });
}

export default router;