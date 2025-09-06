import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUserAccount() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: 'unitradecargo@gmail.com'
      },
      select: {
        id: true,
        email: true,
        totalCredits: true,
        lastCreditUpdate: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log('❌ Пользователь unitradecargo@gmail.com не найден!');
      return;
    }

    console.log('👤 Информация о пользователе unitradecargo@gmail.com:');
    console.log(`   ID: ${user.id}`);
    console.log(`   💰 Текущие кредиты: ${user.totalCredits}`);
    console.log(`   📅 Последнее обновление кредитов: ${user.lastCreditUpdate}`);
    console.log(`   🗓️ Аккаунт создан: ${user.createdAt}`);

    // Проверим все генерации этого пользователя
    const allGenerations = await prisma.generation.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        model: true,
        status: true,
        creditsUsed: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Всего генераций: ${allGenerations.length}`);
    
    let totalUsedCredits = 0;
    let successfulGenerations = 0;
    let failedGenerations = 0;

    allGenerations.forEach(gen => {
      totalUsedCredits += gen.creditsUsed || 0;
      if (gen.status === 'COMPLETED') {
        successfulGenerations++;
      } else if (gen.status === 'FAILED') {
        failedGenerations++;
      }
    });

    console.log(`💸 Общие потраченные кредиты: ${totalUsedCredits}`);
    console.log(`✅ Успешные генерации: ${successfulGenerations}`);
    console.log(`❌ Неудачные генерации: ${failedGenerations}`);

    // Посмотрим последние 10 генераций
    console.log('\n🔍 Последние 10 генераций:');
    allGenerations.slice(0, 10).forEach((gen, index) => {
      console.log(`${index + 1}. ${gen.model} - ${gen.status} - ${gen.creditsUsed} кредитов - ${gen.createdAt}`);
    });

    // Если кредиты действительно 0, попробуем найти другой аккаунт с таким же email
    if (user.totalCredits === 0) {
      console.log('\n🔍 Проверяем возможные дублированные аккаунты...');
      const duplicateUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'unitradecargo' } },
            { username: { contains: 'unitradecargo' } }
          ]
        }
      });

      console.log(`Найдено ${duplicateUsers.length} похожих аккаунтов:`);
      duplicateUsers.forEach(dupUser => {
        console.log(`   📧 ${dupUser.email} - ${dupUser.totalCredits} кредитов - ID: ${dupUser.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке пользователя:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAccount();