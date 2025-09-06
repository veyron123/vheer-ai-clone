import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPremiumUsers() {
  console.log('🔍 Проверка пользователей с платными планами...');
  
  try {
    const users = await prisma.user.findMany({
      include: { subscription: true },
      orderBy: { totalCredits: 'desc' }
    });

    const premiumUsers = [];
    const freeUsers = [];

    users.forEach(user => {
      const plan = user.subscription?.plan || 'FREE';
      const status = user.subscription?.status || 'NONE';
      
      if (plan !== 'FREE') {
        premiumUsers.push({
          email: user.email,
          credits: user.totalCredits,
          plan: plan,
          status: status,
          lastUpdate: user.lastCreditUpdate
        });
      } else {
        freeUsers.push({
          email: user.email,
          credits: user.totalCredits
        });
      }
    });

    console.log('\n🎯 ПОЛЬЗОВАТЕЛИ С ПЛАТНЫМИ ПЛАНАМИ:');
    console.log(`Найдено: ${premiumUsers.length} пользователей\n`);
    
    if (premiumUsers.length === 0) {
      console.log('❌ НЕТ пользователей с платными планами!');
    } else {
      premiumUsers.forEach(user => {
        console.log(`📧 ${user.email}`);
        console.log(`   💰 Кредиты: ${user.credits}`);
        console.log(`   📋 План: ${user.plan} (${user.status})`);
        console.log(`   📅 Обновление: ${user.lastUpdate}`);
        console.log('   ---');
      });
    }

    // Проверим пользователей с аномально высокими кредитами
    const highCreditUsers = freeUsers.filter(user => user.credits > 1000);
    
    if (highCreditUsers.length > 0) {
      console.log('\n⚠️ FREE пользователи с подозрительно высокими кредитами:');
      highCreditUsers.forEach(user => {
        console.log(`📧 ${user.email}: ${user.credits} кредитов`);
      });
    }

    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`💳 Платные планы: ${premiumUsers.length} пользователей`);
    console.log(`🆓 FREE план: ${freeUsers.length} пользователей`);
    console.log(`⚠️ FREE с >1000 кредитов: ${highCreditUsers.length} пользователей`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPremiumUsers();