import cron from 'node-cron';
import CreditService from '../services/creditService.js';

class CreditCronJob {
  static init() {
    // Запускаем cron job каждый день в 00:00
    cron.schedule('0 0 * * *', async () => {
      console.log('🕰️ Daily credit cron job started at:', new Date().toISOString());
      
      try {
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        console.log('✅ Daily credit cron job completed:', {
          totalUsers: result.totalUsers,
          updatedUsers: result.updatedUsers,
          timestamp: new Date().toISOString()
        });

        // Логируем статистику
        if (result.updatedUsers > 0) {
          console.log(`💰 Successfully added daily credits to ${result.updatedUsers} users`);
        }
        
        if (result.totalUsers === 0) {
          console.log('ℹ️ No users found requiring daily credit updates');
        }

      } catch (error) {
        console.error('❌ Error in daily credit cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Дополнительная проверка каждые 6 часов для пользователей, которые могли пропустить обновление
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Hourly credit check started at:', new Date().toISOString());
      
      try {
        // Получаем пользователей, которые не получали кредиты более 24 часов
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        if (result.updatedUsers > 0) {
          console.log(`💰 Catch-up credits added to ${result.updatedUsers} users`);
        }

      } catch (error) {
        console.error('❌ Error in hourly credit check:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('✅ Credit cron jobs initialized successfully');
    console.log('📅 Daily credits will be added at 00:00 UTC every day');
    console.log('🔄 Additional checks every 6 hours');
  }

  // Метод для ручного запуска начисления кредитов (для тестирования)
  static async runManually() {
    try {
      console.log('🚀 Manual credit update started');
      const result = await CreditService.addDailyCreditsToAllUsers();
      
      console.log('✅ Manual credit update completed:', {
        totalUsers: result.totalUsers,
        updatedUsers: result.updatedUsers,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('❌ Error in manual credit update:', error);
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