import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CreditService {
  // Начислить ежедневные кредиты пользователю (только для FREE плана)
  static async addDailyCredits(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Проверяем план пользователя - только FREE план получает ежедневные кредиты
      const userPlan = user.subscription?.plan || 'FREE';
      if (userPlan !== 'FREE') {
        return {
          success: false,
          message: 'Daily credits are only for FREE plan users',
          currentCredits: user.totalCredits,
          userPlan: userPlan
        };
      }

      // Проверяем, прошли ли сутки с последнего обновления
      const now = new Date();
      const lastUpdate = new Date(user.lastCreditUpdate);
      const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);

      // Если прошло меньше 24 часов, не обновляем кредиты
      if (diffInHours < 24) {
        return {
          success: false,
          message: 'Daily credits already reset today',
          nextUpdate: new Date(lastUpdate.getTime() + 24 * 60 * 60 * 1000),
          currentCredits: user.totalCredits
        };
      }

      // ОБНУЛЯЕМ и устанавливаем 100 кредитов (не накапливаем!)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          totalCredits: 100, // Устанавливаем ровно 100, а не добавляем
          lastCreditUpdate: now
        }
      });

      // Записываем транзакцию в историю кредитов
      await prisma.credit.create({
        data: {
          userId: userId,
          amount: 100 - user.totalCredits, // Записываем разницу для истории
          type: 'DAILY_RESET',
          description: 'Daily credits reset to 100 (FREE plan)'
        }
      });

      return {
        success: true,
        message: 'Daily credits reset successfully',
        previousCredits: user.totalCredits,
        currentCredits: updatedUser.totalCredits,
        nextUpdate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('Error resetting daily credits:', error);
      throw error;
    }
  }

  // Проверить и начислить кредиты при входе пользователя
  static async checkAndAddDailyCredits(userId) {
    try {
      return await this.addDailyCredits(userId);
    } catch (error) {
      console.error('Error checking daily credits:', error);
      return {
        success: false,
        message: 'Error checking daily credits',
        error: error.message
      };
    }
  }

  // Получить информацию о кредитах пользователя
  static async getUserCredits(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalCredits: true,
          lastCreditUpdate: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const lastUpdate = new Date(user.lastCreditUpdate);
      const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
      const nextUpdate = new Date(lastUpdate.getTime() + 24 * 60 * 60 * 1000);

      return {
        currentCredits: user.totalCredits,
        lastUpdate: user.lastCreditUpdate,
        nextUpdate: nextUpdate,
        canClaimDaily: diffInHours >= 24,
        hoursUntilNext: Math.max(0, 24 - diffInHours)
      };

    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }

  // Списать кредиты при генерации изображения
  static async deductCredits(userId, amount, description = 'Image generation') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalCredits: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.totalCredits < amount) {
        throw new Error('Insufficient credits');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          totalCredits: user.totalCredits - amount
        }
      });

      // Записываем транзакцию
      await prisma.credit.create({
        data: {
          userId: userId,
          amount: -amount,
          type: 'DEDUCTION',
          description: description
        }
      });

      return {
        success: true,
        remainingCredits: updatedUser.totalCredits,
        deductedAmount: amount
      };

    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  }

  // Получить историю транзакций кредитов
  static async getCreditHistory(userId, limit = 50) {
    try {
      const credits = await prisma.credit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return credits;
    } catch (error) {
      console.error('Error getting credit history:', error);
      throw error;
    }
  }

  // Массовое обнуление и начисление ежедневных кредитов для пользователей FREE плана (для cron job)
  static async addDailyCreditsToAllUsers() {
    try {
      const now = new Date();
      const yesterdayTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Находим пользователей с FREE планом, которым нужно обновить кредиты
      const users = await prisma.user.findMany({
        where: {
          lastCreditUpdate: {
            lt: yesterdayTime
          }
        },
        include: {
          subscription: true
        }
      });

      let updateCount = 0;
      let skippedCount = 0;
      const results = [];

      for (const user of users) {
        try {
          // Проверяем план пользователя
          const userPlan = user.subscription?.plan || 'FREE';
          
          if (userPlan !== 'FREE') {
            skippedCount++;
            results.push({
              userId: user.id,
              success: false,
              message: `Skipped - user has ${userPlan} plan`,
              plan: userPlan
            });
            continue;
          }

          const result = await this.addDailyCredits(user.id);
          if (result.success) {
            updateCount++;
          }
          results.push({
            userId: user.id,
            success: result.success,
            message: result.message,
            previousCredits: result.previousCredits,
            currentCredits: result.currentCredits
          });
        } catch (error) {
          results.push({
            userId: user.id,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`💰 Daily credits reset completed:`, {
        totalUsers: users.length,
        freeUsersUpdated: updateCount,
        nonFreeUsersSkipped: skippedCount,
        timestamp: new Date().toISOString()
      });

      return {
        totalUsers: users.length,
        updatedUsers: updateCount,
        skippedUsers: skippedCount,
        results: results
      };

    } catch (error) {
      console.error('Error in mass daily credits reset:', error);
      throw error;
    }
  }
}

export default CreditService;