const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Исправляю дублированные кредиты...');
  console.log('=' .repeat(50));
  
  const email = 'oksanahavryliak1965@gmail.com';
  
  // Найти пользователя
  const user = await prisma.user.findUnique({
    where: { email },
    include: { 
      credits: {
        orderBy: { createdAt: 'asc' }
      },
      payments: true,
      subscription: true
    }
  });
  
  if (!user) {
    console.log('❌ Пользователь не найден');
    return;
  }
  
  console.log(`📧 Исправляю для: ${user.email}`);
  console.log(`💰 Текущий баланс: ${user.totalCredits} кредитов`);
  
  // Найти дублированные PURCHASE операции
  const purchaseCredits = user.credits.filter(c => c.type === 'PURCHASE');
  
  console.log(`\n🔍 Найдено PURCHASE операций: ${purchaseCredits.length}`);
  
  if (purchaseCredits.length <= 1) {
    console.log('✅ Дублирования не найдено, исправления не требуются');
    return;
  }
  
  // Группируем по OrderReference из description
  const orderRefGroups = {};
  purchaseCredits.forEach(credit => {
    const match = credit.description?.match(/WFP-BTN-\d+-[a-f0-9]+/);
    if (match) {
      const orderRef = match[0];
      if (!orderRefGroups[orderRef]) {
        orderRefGroups[orderRef] = [];
      }
      orderRefGroups[orderRef].push(credit);
    }
  });
  
  console.log('\n📊 Группировка по OrderReference:');
  let totalDuplicates = 0;
  let creditsToRemove = [];
  
  Object.entries(orderRefGroups).forEach(([orderRef, credits]) => {
    console.log(`   ${orderRef}: ${credits.length} операций`);
    
    if (credits.length > 1) {
      // Оставляем самую раннюю, остальные удаляем
      const sorted = credits.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keep = sorted[0];
      const duplicates = sorted.slice(1);
      
      console.log(`      ✅ Оставляю: ${new Date(keep.createdAt).toLocaleString()}`);
      duplicates.forEach(dup => {
        console.log(`      ❌ Удаляю: ${new Date(dup.createdAt).toLocaleString()}`);
        creditsToRemove.push(dup);
        totalDuplicates += dup.amount;
      });
    }
  });
  
  if (creditsToRemove.length === 0) {
    console.log('\n✅ Дублирования не найдено');
    return;
  }
  
  console.log(`\n🗑️  К удалению: ${creditsToRemove.length} операций на сумму ${totalDuplicates} кредитов`);
  
  // Выполняем исправление в транзакции
  const result = await prisma.$transaction(async (tx) => {
    // Удаляем дублированные credit записи
    const creditIds = creditsToRemove.map(c => c.id);
    await tx.credit.deleteMany({
      where: { id: { in: creditIds } }
    });
    
    // Обновляем баланс пользователя
    const newBalance = user.totalCredits - totalDuplicates;
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { totalCredits: newBalance }
    });
    
    return { deletedCredits: creditIds.length, newBalance };
  });
  
  console.log('\n✅ Исправление выполнено:');
  console.log(`   🗑️  Удалено дублированных записей: ${result.deletedCredits}`);
  console.log(`   💰 Старый баланс: ${user.totalCredits} кредитов`);
  console.log(`   💰 Новый баланс: ${result.newBalance} кредитов`);
  console.log(`   📉 Убрано лишних кредитов: ${totalDuplicates}`);
  
  // Также удаляем дублированные платежи
  console.log('\n🔧 Очищаю дублированные платежи...');
  
  const paymentGroups = {};
  user.payments.forEach(payment => {
    const orderRef = payment.wayforpayOrderReference;
    if (orderRef) {
      if (!paymentGroups[orderRef]) {
        paymentGroups[orderRef] = [];
      }
      paymentGroups[orderRef].push(payment);
    }
  });
  
  let paymentsToDelete = [];
  Object.entries(paymentGroups).forEach(([orderRef, payments]) => {
    if (payments.length > 1) {
      const sorted = payments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keep = sorted[0];
      const duplicates = sorted.slice(1);
      
      paymentsToDelete.push(...duplicates.map(p => p.id));
      console.log(`   ${orderRef}: Оставляю 1 из ${payments.length} платежей`);
    }
  });
  
  if (paymentsToDelete.length > 0) {
    await prisma.payment.deleteMany({
      where: { id: { in: paymentsToDelete } }
    });
    console.log(`   🗑️  Удалено дублированных платежей: ${paymentsToDelete.length}`);
  }
  
  console.log('\n🎉 Очистка завершена успешно!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());