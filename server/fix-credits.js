import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFreeUserCredits() {
  console.log('🚀 Запуск принудительного исправления кредитов FREE пользователей...');
  
  try {
    // Найти всех пользователей без подписки или с FREE планом
    const freeUsers = await prisma.user.findMany({
      where: {
        OR: [
          { subscription: null },
          { subscription: { plan: 'FREE' } }
        ]
      },
      include: { subscription: true }
    });
    
    console.log(`📊 Найдено ${freeUsers.length} FREE пользователей`);
    
    let updatedCount = 0;
    let alreadyCorrect = 0;
    
    for (const user of freeUsers) {
      const isFreePlan = !user.subscription || user.subscription.plan === 'FREE';
      
      if (isFreePlan && user.totalCredits !== 100) {
        const previousCredits = user.totalCredits;
        
        // Принудительно установить 100 кредитов
        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalCredits: 100,
            lastCreditUpdate: new Date()
          }
        });
        
        // Создать запись в истории
        await prisma.credit.create({
          data: {
            userId: user.id,
            amount: 100 - previousCredits,
            type: 'CORRECTION',
            description: `Fixed FREE user credits from ${previousCredits} to 100`
          }
        });
        
        console.log(`✅ ${user.email}: ${previousCredits} → 100 кредитов`);
        updatedCount++;
        
      } else if (isFreePlan && user.totalCredits === 100) {
        console.log(`✓ ${user.email}: уже 100 кредитов`);
        alreadyCorrect++;
      }
    }
    
    console.log(`\n📊 Результаты:`);
    console.log(`✅ Исправлено: ${updatedCount} пользователей`);
    console.log(`✓ Уже правильно: ${alreadyCorrect} пользователей`);
    console.log(`📋 Всего FREE: ${freeUsers.length} пользователей`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFreeUserCredits();