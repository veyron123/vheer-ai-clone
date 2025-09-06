import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function refundLostCredits() {
  try {
    // Найдем все неудачные генерации за последние 24 часа
    const failedGenerations = await prisma.generation.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        },
        creditsUsed: {
          gt: 0 // Где кредиты были списаны
        }
      },
      include: {
        user: true
      }
    });

    console.log(`🔍 Найдено ${failedGenerations.length} неудачных генераций с потерянными кредитами`);

    if (failedGenerations.length === 0) {
      console.log('✅ Нет кредитов для восстановления');
      return;
    }

    // Группируем по пользователям
    const creditRefunds = {};
    failedGenerations.forEach(gen => {
      if (!creditRefunds[gen.userId]) {
        creditRefunds[gen.userId] = {
          user: gen.user,
          totalRefund: 0,
          generations: []
        };
      }
      creditRefunds[gen.userId].totalRefund += gen.creditsUsed;
      creditRefunds[gen.userId].generations.push({
        id: gen.id,
        model: gen.model,
        credits: gen.creditsUsed,
        date: gen.createdAt
      });
    });

    console.log('\n💰 Планируемые возвраты кредитов:');
    for (const [userId, refundData] of Object.entries(creditRefunds)) {
      console.log(`📧 ${refundData.user.email}`);
      console.log(`   💸 К возврату: ${refundData.totalRefund} кредитов`);
      console.log(`   📊 Текущий баланс: ${refundData.user.totalCredits}`);
      console.log(`   🔮 Новый баланс: ${refundData.user.totalCredits + refundData.totalRefund}`);
      console.log(`   📋 Генерации: ${refundData.generations.length}`);
      console.log('   ---');
    }

    // Спросим подтверждение (в реальности тут должен быть интерактивный ввод)
    // Но для автоматизации выполним возврат
    console.log('\n🔄 Выполняем возврат кредитов...');

    for (const [userId, refundData] of Object.entries(creditRefunds)) {
      const newBalance = refundData.user.totalCredits + refundData.totalRefund;
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          totalCredits: newBalance,
          lastCreditUpdate: new Date()
        }
      });

      console.log(`✅ Возвращено ${refundData.totalRefund} кредитов пользователю ${refundData.user.email}`);
    }

    console.log('\n🎉 Все кредиты успешно восстановлены!');

  } catch (error) {
    console.error('❌ Ошибка при восстановлении кредитов:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

refundLostCredits();