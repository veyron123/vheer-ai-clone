import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function restoreCredits() {
  try {
    const userId = 'cmeiiqjrb0000ef1lt2m3oarq'; // ID пользователя unitradecargo@gmail.com
    
    // Найдем все неудачные генерации сегодня
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const failedGenerationsToday = await prisma.generation.findMany({
      where: {
        userId: userId,
        status: 'FAILED',
        createdAt: {
          gte: todayStart
        },
        creditsUsed: {
          gt: 0
        }
      }
    });

    console.log(`🔍 Найдено ${failedGenerationsToday.length} неудачных генераций сегодня`);
    
    let totalRefund = 0;
    failedGenerationsToday.forEach(gen => {
      totalRefund += gen.creditsUsed;
      console.log(`❌ ${gen.model} - ${gen.creditsUsed} кредитов - ${gen.createdAt}`);
    });

    if (totalRefund > 0) {
      // Получим текущий баланс
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalCredits: true }
      });

      const newBalance = user.totalCredits + totalRefund;
      console.log(`\n💰 Текущий баланс: ${user.totalCredits}`);
      console.log(`💸 К возврату: ${totalRefund}`);
      console.log(`🎯 Новый баланс: ${newBalance}`);

      // Обновим баланс
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalCredits: newBalance,
          lastCreditUpdate: new Date()
        }
      });

      console.log(`✅ Возвращено ${totalRefund} кредитов пользователю unitradecargo@gmail.com`);
      console.log(`🎉 Новый баланс: ${newBalance} кредитов`);
    } else {
      console.log('ℹ️ Нет кредитов для возврата');
    }

    // Также добавим бонус за неудобства
    const bonusCredits = 500;
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalCredits: true }
    });

    const finalBalance = finalUser.totalCredits + bonusCredits;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalCredits: finalBalance,
        lastCreditUpdate: new Date()
      }
    });

    console.log(`\n🎁 Добавлен бонус за неудобства: ${bonusCredits} кредитов`);
    console.log(`🏆 ИТОГОВЫЙ БАЛАНС: ${finalBalance} кредитов`);

  } catch (error) {
    console.error('❌ Ошибка при восстановлении кредитов:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreCredits();