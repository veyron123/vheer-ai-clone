const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Очищаю дублированные платежи перед миграцией...');
  console.log('=' .repeat(50));
  
  // Найти все платежи
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`📊 Всего платежей найдено: ${payments.length}`);
  
  // Группируем по wayforpayOrderReference из description
  const orderRefGroups = {};
  const paymentsToDelete = [];
  
  payments.forEach(payment => {
    // Извлекаем orderReference из description
    const match = payment.description?.match(/WFP-BTN-\d+-[a-f0-9]+/);
    if (match) {
      const orderRef = match[0];
      
      if (!orderRefGroups[orderRef]) {
        orderRefGroups[orderRef] = [];
      }
      orderRefGroups[orderRef].push(payment);
    }
  });
  
  console.log(`📋 Найдено групп с OrderReference: ${Object.keys(orderRefGroups).length}`);
  
  // Находим дубликаты
  Object.entries(orderRefGroups).forEach(([orderRef, paymentGroup]) => {
    if (paymentGroup.length > 1) {
      console.log(`🔍 ${orderRef}: ${paymentGroup.length} платежей`);
      
      // Оставляем самый ранний платёж, остальные удаляем
      const sorted = paymentGroup.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keep = sorted[0];
      const duplicates = sorted.slice(1);
      
      console.log(`   ✅ Оставляю: ${keep.id} (${new Date(keep.createdAt).toLocaleString()})`);
      duplicates.forEach(dup => {
        console.log(`   ❌ Удаляю: ${dup.id} (${new Date(dup.createdAt).toLocaleString()})`);
        paymentsToDelete.push(dup.id);
      });
    }
  });
  
  if (paymentsToDelete.length === 0) {
    console.log('✅ Дублирующихся платежей не найдено');
    return;
  }
  
  console.log(`\n🗑️  Удаляю ${paymentsToDelete.length} дублированных платежей...`);
  
  // Удаляем дубликаты
  const result = await prisma.payment.deleteMany({
    where: { id: { in: paymentsToDelete } }
  });
  
  console.log(`✅ Удалено платежей: ${result.count}`);
  
  // Теперь добавляем wayforpayOrderReference к оставшимся платежам
  console.log('\n🔧 Обновляю оставшиеся платежи с wayforpayOrderReference...');
  
  const remainingPayments = await prisma.payment.findMany({
    where: { description: { contains: 'WFP-BTN-' } }
  });
  
  for (const payment of remainingPayments) {
    const match = payment.description?.match(/WFP-BTN-\d+-[a-f0-9]+/);
    if (match) {
      const orderRef = match[0];
      
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { wayforpayOrderReference: orderRef }
        });
        console.log(`   ✅ Обновлён платёж ${payment.id} с OrderRef: ${orderRef}`);
      } catch (error) {
        console.log(`   ❌ Ошибка обновления ${payment.id}:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 Очистка завершена! Теперь можно безопасно применить миграцию.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());