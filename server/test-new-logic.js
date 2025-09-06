import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewCreditLogic() {
  console.log('🧪 Тестирование новой логики кредитов (принудительно)...');
  
  try {
    // Найти всех пользователей
    const users = await prisma.user.findMany({
      select: { 
        id: true,
        email: true,
        totalCredits: true,
        lastCreditUpdate: true,
        subscription: true
      }
    });

    const now = new Date();
    
    let freeUsersProcessed = 0;
    let premiumUsersSkipped = 0;
    
    for (const user of users) {
      const isFreePlan = !user.subscription || user.subscription.plan === 'FREE';
      
      if (isFreePlan) {
        console.log(`✅ FREE user: ${user.email} - Credits: ${user.totalCredits} → WOULD RESET TO 100`);
        freeUsersProcessed++;
      } else {
        console.log(`⏭️ PREMIUM user: ${user.email} (${user.subscription.plan}) - Credits: ${user.totalCredits} → WOULD SKIP`);
        premiumUsersSkipped++;
      }
    }
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:`);
    console.log(`🆓 FREE пользователи: ${freeUsersProcessed} (будут сброшены до 100)`);
    console.log(`💳 PREMIUM пользователи: ${premiumUsersSkipped} (будут пропущены)`);
    console.log(`📋 Всего пользователей: ${users.length}`);
    
    // Проверим текущие кредиты у premium пользователей
    const premiumUsers = users.filter(u => u.subscription && u.subscription.plan !== 'FREE');
    
    if (premiumUsers.length > 0) {
      console.log(`\n💳 ДЕТАЛИ PREMIUM ПОЛЬЗОВАТЕЛЕЙ:`);
      premiumUsers.forEach(user => {
        console.log(`📧 ${user.email}:`);
        console.log(`   💰 Текущие кредиты: ${user.totalCredits}`);
        console.log(`   📋 План: ${user.subscription.plan}`);
        console.log(`   ⏭️ Действие: НЕ будет получать ежедневные кредиты`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewCreditLogic();