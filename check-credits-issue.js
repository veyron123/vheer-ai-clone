const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверяю кредиты на аккаунте @oksanahavryliak1965_1755616812613...');
  console.log('=' .repeat(60));
  
  const username = 'oksanahavryliak1965_1755616812613';
  const email = 'oksanahavryliak1965@gmail.com';
  
  // Найти пользователя
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { username: username },
        { email: email }
      ]
    },
    include: { 
      subscription: true,
      credits: {
        orderBy: { createdAt: 'desc' }
      },
      payments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!user) {
    console.log('❌ Пользователь не найден');
    console.log(`   Искали: username="${username}" или email="${email}"`);
    
    // Поиск похожих пользователей
    console.log('\n🔎 Похожие пользователи:');
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'oksana' } },
          { email: { contains: 'oksana' } }
        ]
      },
      select: {
        email: true,
        username: true,
        totalCredits: true,
        subscription: {
          select: {
            plan: true,
            status: true
          }
        }
      }
    });
    
    similarUsers.forEach(u => {
      console.log(`   📧 ${u.email} | 👤 ${u.username} | 💰 ${u.totalCredits} кредитов`);
      if (u.subscription) {
        console.log(`      📊 Подписка: ${u.subscription.plan} (${u.subscription.status})`);
      }
    });
    
    return;
  }
  
  console.log('✅ Пользователь найден:');
  console.log(`📧 Email: ${user.email}`);
  console.log(`👤 Username: ${user.username}`);
  console.log(`💰 Общий баланс: ${user.totalCredits} кредитов`);
  console.log(`📅 Последнее обновление: ${new Date(user.lastCreditUpdate).toLocaleString()}`);
  console.log(`📅 Регистрация: ${new Date(user.createdAt).toLocaleString()}`);
  
  // Информация о подписке
  console.log('\n📋 Подписка:');
  if (user.subscription) {
    const sub = user.subscription;
    console.log(`   📊 План: ${sub.plan}`);
    console.log(`   ✅ Статус: ${sub.status}`);
    console.log(`   📅 Создана: ${new Date(sub.createdAt).toLocaleString()}`);
    console.log(`   📅 Обновлена: ${new Date(sub.updatedAt).toLocaleString()}`);
    
    if (sub.cancelledAt) {
      console.log(`   🚫 Отменена: ${new Date(sub.cancelledAt).toLocaleString()}`);
    }
    
    if (sub.wayforpayOrderReference) {
      console.log(`   🔑 OrderRef: ${sub.wayforpayOrderReference}`);
    }
  } else {
    console.log('   ❌ Подписки нет');
  }
  
  // История кредитов
  console.log('\n💳 История кредитов:');
  if (user.credits.length === 0) {
    console.log('   📝 История кредитов пуста');
  } else {
    console.log(`   📝 Всего операций: ${user.credits.length}`);
    
    let totalAdded = 0;
    let totalSpent = 0;
    
    user.credits.forEach((credit, index) => {
      const date = new Date(credit.createdAt).toLocaleString();
      const isPositive = credit.amount > 0;
      const emoji = isPositive ? '➕' : '➖';
      
      if (isPositive) totalAdded += credit.amount;
      else totalSpent += Math.abs(credit.amount);
      
      console.log(`   ${index + 1}. ${emoji} ${credit.amount} - ${credit.type} (${date})`);
      if (credit.description) {
        console.log(`      💬 ${credit.description}`);
      }
    });
    
    console.log(`\n   📊 Итого получено: +${totalAdded} кредитов`);
    console.log(`   📊 Итого потрачено: -${totalSpent} кредитов`);
    console.log(`   📊 Расчётный баланс: ${totalAdded - totalSpent} кредитов`);
    console.log(`   📊 Текущий баланс: ${user.totalCredits} кредитов`);
    
    if (user.totalCredits !== (totalAdded - totalSpent)) {
      console.log('   ⚠️  НЕСООТВЕТСТВИЕ! Расчётный баланс не совпадает с текущим');
    }
  }
  
  // История платежей
  console.log('\n💰 История платежей:');
  if (user.payments.length === 0) {
    console.log('   📝 Платежей не найдено');
  } else {
    console.log(`   📝 Всего платежей: ${user.payments.length}`);
    
    user.payments.forEach((payment, index) => {
      const date = new Date(payment.createdAt).toLocaleString();
      console.log(`   ${index + 1}. 💵 ${payment.amount} ${payment.currency} - ${payment.status}`);
      console.log(`      📅 ${date}`);
      console.log(`      🏷️  ${payment.description || 'Без описания'}`);
      
      if (payment.wayforpayOrderReference) {
        console.log(`      🔑 WayForPay: ${payment.wayforpayOrderReference}`);
      }
    });
  }
  
  // Анализ проблемы
  console.log('\n🕵️ Анализ проблемы:');
  
  const expectedCredits = 100 + 800; // 100 бесплатных + 800 за подписку
  console.log(`   🎯 Ожидаемо кредитов: ${expectedCredits}`);
  console.log(`   📊 Фактически кредитов: ${user.totalCredits}`);
  console.log(`   📈 Разница: ${user.totalCredits - expectedCredits}`);
  
  if (user.totalCredits > expectedCredits) {
    console.log('   🚨 ПРОБЛЕМА: Кредитов больше ожидаемого!');
    
    // Возможные причины
    const excess = user.totalCredits - expectedCredits;
    console.log(`   🔍 Излишек: ${excess} кредитов`);
    console.log('\n   💡 Возможные причины:');
    console.log('      1. Множественные начисления за подписку');
    console.log('      2. Дублирование ежедневных бонусов');
    console.log('      3. Ошибка в cron-задачах');
    console.log('      4. Множественные регистрационные бонусы');
    
    // Проверка на дубликаты
    const duplicateTypes = {};
    user.credits.forEach(credit => {
      if (duplicateTypes[credit.type]) {
        duplicateTypes[credit.type]++;
      } else {
        duplicateTypes[credit.type] = 1;
      }
    });
    
    console.log('\n   📊 Статистика по типам операций:');
    Object.entries(duplicateTypes).forEach(([type, count]) => {
      console.log(`      ${type}: ${count} раз`);
      if (count > 1 && (type === 'SUBSCRIPTION' || type === 'REGISTRATION')) {
        console.log(`         ⚠️  Подозрительно! ${type} должен быть только 1 раз`);
      }
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());