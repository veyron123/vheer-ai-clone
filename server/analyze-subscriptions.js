import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeSubscriptions() {
  console.log('🔍 Подробный анализ подписок и будущего платных пользователей...\n');
  
  try {
    // Найти всех пользователей с подписками
    const subscriptions = await prisma.subscription.findMany({
      include: { 
        user: {
          select: {
            email: true,
            totalCredits: true
          }
        }
      },
      where: {
        plan: { not: 'FREE' }
      }
    });

    console.log(`📊 Найдено ${subscriptions.length} активных платных подписок:\n`);

    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. 📧 ${sub.user.email}`);
      console.log(`   📋 План: ${sub.plan}`);
      console.log(`   📊 Статус: ${sub.status}`);
      console.log(`   💰 Текущие кредиты: ${sub.user.totalCredits}`);
      console.log(`   📅 Создана: ${new Date(sub.createdAt).toLocaleDateString()}`);
      
      if (sub.currentPeriodEnd) {
        const periodEnd = new Date(sub.currentPeriodEnd);
        console.log(`   ⏰ Истекает: ${periodEnd.toLocaleDateString()}`);
        
        if (periodEnd < now) {
          console.log(`   ❌ УЖЕ ИСТЕКЛА!`);
        } else if (periodEnd < oneMonthLater) {
          const daysLeft = Math.ceil((periodEnd - now) / (24 * 60 * 60 * 1000));
          console.log(`   ⚠️ Истекает через ${daysLeft} дней`);
        } else {
          console.log(`   ✅ Действует больше месяца`);
        }
      } else {
        console.log(`   ⚠️ НЕ УСТАНОВЛЕН срок окончания`);
      }
      
      // Проверим настройки рекуррентных платежей
      console.log(`   🔄 Автопродление: ${sub.isRecurring ? 'ДА' : 'НЕТ'}`);
      if (sub.isRecurring) {
        console.log(`   🎫 Токен: ${sub.recurringToken ? 'ЕСТЬ' : 'НЕТ'}`);
        console.log(`   📅 Следующий платеж: ${sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString() : 'НЕ УСТАНОВЛЕН'}`);
      }
      
      console.log('   ---\n');
    });

    // Анализ что произойдет через месяц
    console.log('\n🔮 ПРОГНОЗ НА МЕСЯЦ ВПЕРЕД:\n');
    
    let expiredCount = 0;
    let willExpireCount = 0;
    let activeCount = 0;
    let recurringCount = 0;

    subscriptions.forEach(sub => {
      if (sub.currentPeriodEnd) {
        const periodEnd = new Date(sub.currentPeriodEnd);
        if (periodEnd < now) {
          expiredCount++;
        } else if (periodEnd < oneMonthLater) {
          willExpireCount++;
        } else {
          activeCount++;
        }
      }
      
      if (sub.isRecurring && sub.recurringToken) {
        recurringCount++;
      }
    });

    console.log(`❌ Уже истекшие подписки: ${expiredCount}`);
    console.log(`⚠️ Истекут в течение месяца: ${willExpireCount}`);
    console.log(`✅ Останутся активными: ${activeCount}`);
    console.log(`🔄 С настроенным автопродлением: ${recurringCount}`);

    console.log('\n🎯 ЧТО ПРОИЗОЙДЕТ С КРЕДИТАМИ ЧЕРЕЗ МЕСЯЦ:\n');
    
    subscriptions.forEach(sub => {
      const user = sub.user;
      const currentCredits = user.totalCredits;
      
      console.log(`📧 ${user.email}:`);
      console.log(`   💰 Сейчас: ${currentCredits} кредитов`);
      
      if (sub.currentPeriodEnd) {
        const periodEnd = new Date(sub.currentPeriodEnd);
        if (periodEnd < oneMonthLater) {
          if (sub.isRecurring && sub.recurringToken) {
            // Если есть автопродление - получит новые кредиты
            const planCredits = sub.plan === 'BASIC' ? 800 : 
                              sub.plan === 'PRO' ? 3000 : 
                              sub.plan === 'ENTERPRISE' ? 15000 : 0;
            console.log(`   🔄 АВТОПРОДЛЕНИЕ: +${planCredits} кредитов`);
            console.log(`   📈 Итого будет: ${currentCredits + planCredits} кредитов`);
          } else {
            // Подписка истечет, станет FREE пользователем
            console.log(`   ❌ ПОДПИСКА ИСТЕЧЕТ → станет FREE пользователем`);
            console.log(`   📉 Будет получать: 100 кредитов ежедневно (сброс)`);
          }
        } else {
          // Подписка продолжается
          console.log(`   ✅ ПОДПИСКА АКТИВНА → кредиты будут только расходоваться`);
          console.log(`   📊 Останется: зависит от использования`);
        }
      } else {
        console.log(`   ⚠️ НЕОПРЕДЕЛЕННО (нет срока окончания)`);
      }
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSubscriptions();