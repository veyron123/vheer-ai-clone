import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/email.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Помечает корзины как брошенные, если нет активности более 2 часов
 */
const markAbandonedCarts = async () => {
  try {
    // Используем фиксированную задержку 2 часа (можно вынести в env)
    const delayHours = 2;
    const delayTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);
    
    // Находим корзины для пометки как брошенные
    const cartsToMark = await prisma.cartSession.findMany({
      where: {
        status: 'active',
        lastActivityAt: {
          lt: delayTime
        }
      }
    });
    
    if (cartsToMark.length === 0) {
      return { count: 0, emailsSent: 0 };
    }
    
    // Помечаем как брошенные
    const result = await prisma.cartSession.updateMany({
      where: {
        status: 'active',
        lastActivityAt: {
          lt: delayTime
        }
      },
      data: {
        status: 'abandoned',
        abandonedAt: new Date()
      }
    });
    
    // Отправляем email уведомления
    let emailsSent = 0;
    // Временно отключаем email уведомления, так как нет таблицы настроек
    const emailEnabled = false;
    
    if (emailEnabled) {
      for (const cart of cartsToMark) {
        if (cart.customerEmail && !cart.emailSent) {
          try {
            const emailResult = await emailService.sendAbandonedCartReminder(
              cart.customerEmail,
              {
                sessionId: cart.sessionId,
                items: cart.items || [],
                totalAmount: cart.totalAmount || 0,
                createdAt: cart.createdAt
              }
            );
            
            if (emailResult.success) {
              // Помечаем что email отправлен
              await prisma.cartSession.update({
                where: { id: cart.id },
                data: { 
                  emailSent: true,
                  emailSentAt: new Date()
                }
              });
              emailsSent++;
            }
          } catch (error) {
            logger.error('Failed to send abandoned cart email', {
              cartId: cart.id,
              email: cart.customerEmail,
              error: error.message
            });
          }
        }
      }
    }
    
    if (result.count > 0) {
      console.log(`[${new Date().toISOString()}] 🛒 Помечено ${result.count} корзин как брошенные, отправлено ${emailsSent} email`);
    }
    
    return { count: result.count, emailsSent };
  } catch (error) {
    console.error('Ошибка при пометке брошенных корзин:', error);
    return { count: 0, emailsSent: 0 };
  }
};

/**
 * Очистка старых корзин (старше 90 дней для лучшей аналитики)
 */
const cleanupOldCarts = async () => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const result = await prisma.cartSession.deleteMany({
      where: {
        OR: [
          {
            status: 'abandoned',
            abandonedAt: {
              lt: ninetyDaysAgo
            }
          },
          {
            status: 'converted',
            createdAt: {
              lt: ninetyDaysAgo
            }
          }
        ]
      }
    });
    
    if (result.count > 0) {
      console.log(`[${new Date().toISOString()}] 🗑️ Удалено ${result.count} старых корзин`);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при очистке старых корзин:', error);
  }
};

/**
 * Инициализация cron задач для отслеживания корзин
 */
const initializeCartTrackingJobs = () => {
  // Проверка брошенных корзин каждые 30 минут
  cron.schedule('*/30 * * * *', async () => {
    await markAbandonedCarts();
  });
  
  // Очистка старых корзин каждый день в 3:00 ночи
  cron.schedule('0 3 * * *', async () => {
    await cleanupOldCarts();
  });
  
  console.log('✅ Задачи отслеживания корзин инициализированы');
  console.log('   - Проверка брошенных корзин: каждые 30 минут');
  console.log('   - Очистка старых корзин (>90 дней): ежедневно в 3:00');
};

export default initializeCartTrackingJobs;