import cron from 'node-cron';
import * as CreditService from '../services/creditService.js';

class CreditCronJob {
  static init() {
    // Запускаем cron job каждый день в 00:00 для сброса кредитов FREE пользователей (до 100). PREMIUM пользователи не получают ежедневных кредитов
    cron.schedule('0 0 * * *', async () => {
      console.log('🕰️ Daily credit reset job started at:', new Date().toISOString());
      
      try {
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        console.log('✅ Daily credit reset job completed:', {
          totalUsers: result.totalUsers,
          updatedUsers: result.updatedUsers,
          skippedUsers: result.skippedUsers,
          freeUsersReset: result.freeUsersReset,
          premiumUsersAdded: result.premiumUsersAdded,
          timestamp: new Date().toISOString()
        });

        // Логируем статистику
        if (result.freeUsersReset > 0) {
          console.log(`🔄 Successfully reset ${result.freeUsersReset} FREE users to 100 credits`);
        }
        
        if (result.premiumUsersAdded > 0) {
          console.log(`⏭️ Skipped ${result.premiumUsersAdded} PREMIUM users (no daily credits for paid plans)`);
        }
        
        if (result.skippedUsers > 0) {
          console.log(`⏭️ Skipped ${result.skippedUsers} users (not due for update)`);
        }
        
        if (result.totalUsers === 0) {
          console.log('ℹ️ No users found in database');
        }

      } catch (error) {
        console.error('❌ Error in daily credit reset job:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Дополнительная проверка каждые 6 часов для пользователей, которые могли пропустить обновление
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 6-hour credit check started at:', new Date().toISOString());
      
      try {
        // Проверяем всех пользователей, которые не получали обновление кредитов более 24 часов
        const result = await CreditService.addDailyCreditsToAllUsers();
        
        if (result.updatedUsers > 0) {
          console.log(`🔄 Catch-up credit update: ${result.freeUsersReset} FREE users reset, ${result.premiumUsersAdded} PREMIUM users skipped`);
        }
        
        if (result.skippedUsers > 0) {
          console.log(`⏭️ Skipped ${result.skippedUsers} users in catch-up check (not due for update)`);
        }

      } catch (error) {
        console.error('❌ Error in 6-hour credit check:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('✅ Credit reset cron jobs initialized successfully');
    console.log('📅 Daily credits: FREE users reset to 100, PREMIUM users get NO daily credits at 00:00 UTC');
    console.log('🔄 Additional checks every 6 hours for missed updates');
  }

  // Метод для ручного запуска сброса кредитов (для тестирования)
  static async runManually() {
    try {
      console.log('🚀 Manual credit reset started');
      const result = await CreditService.addDailyCreditsToAllUsers();
      
      console.log('✅ Manual credit reset completed:', {
        totalUsers: result.totalUsers,
        updatedUsers: result.updatedUsers,
        skippedUsers: result.skippedUsers,
        freeUsersReset: result.freeUsersReset,
        premiumUsersAdded: result.premiumUsersAdded,
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