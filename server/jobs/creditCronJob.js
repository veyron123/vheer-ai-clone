import cron from 'node-cron';
import * as CreditService from '../services/creditService.js';

class CreditCronJob {
  static init() {
    // Запускаем cron job каждый день в 00:00 для сброса кредитов FREE пользователей
    cron.schedule('0 0 * * *', async () => {
      console.log('🕰️ Daily credit reset job started at:', new Date().toISOString());
      
      try {
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        console.log('✅ Daily credit reset job completed:', {
          totalUsers: result.totalUsers,
          freeUsersUpdated: result.updatedUsers,
          nonFreeUsersSkipped: result.skippedUsers,
          timestamp: new Date().toISOString()
        });

        // Логируем статистику
        if (result.updatedUsers > 0) {
          console.log(`💰 Successfully reset daily credits for ${result.updatedUsers} FREE plan users`);
        }
        
        if (result.skippedUsers > 0) {
          console.log(`⏭️ Skipped ${result.skippedUsers} non-FREE plan users`);
        }
        
        if (result.totalUsers === 0) {
          console.log('ℹ️ No users found requiring daily credit reset');
        }

      } catch (error) {
        console.error('❌ Error in daily credit reset job:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Дополнительная проверка каждые 6 часов для FREE пользователей, которые могли пропустить сброс
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 6-hour credit check started at:', new Date().toISOString());
      
      try {
        // Получаем FREE пользователей, которые не получали сброс кредитов более 24 часов
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        if (result.updatedUsers > 0) {
          console.log(`💰 Catch-up credit reset for ${result.updatedUsers} FREE users`);
        }
        
        if (result.skippedUsers > 0) {
          console.log(`⏭️ Skipped ${result.skippedUsers} non-FREE users in catch-up check`);
        }

      } catch (error) {
        console.error('❌ Error in 6-hour credit check:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('✅ Credit reset cron jobs initialized successfully');
    console.log('📅 Daily credits will be reset to 100 for FREE users at 00:00 UTC');
    console.log('🔄 Additional checks every 6 hours for missed resets');
  }

  // Метод для ручного запуска сброса кредитов (для тестирования)
  static async runManually() {
    try {
      console.log('🚀 Manual credit reset started');
      const result = await CreditService.addDailyCreditsToAllUsers();
      
      console.log('✅ Manual credit reset completed:', {
        totalUsers: result.totalUsers,
        freeUsersUpdated: result.updatedUsers,
        nonFreeUsersSkipped: result.skippedUsers,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('❌ Error in manual credit reset:', error);
      throw error;
    }
  }

  // Получить информацию о следующем запуске
  static getNextRunInfo() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    
    const nextSixHour = new Date(now);
    const currentHour = now.getUTCHours();
    const nextSixHourTime = Math.ceil(currentHour / 6) * 6;
    nextSixHour.setUTCHours(nextSixHourTime, 0, 0, 0);
    
    return {
      nextDailyRun: nextMidnight.toISOString(),
      nextHourlyCheck: nextSixHour.toISOString(),
      currentTime: now.toISOString()
    };
  }
}

export default CreditCronJob;