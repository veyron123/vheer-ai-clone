import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRecentGenerations() {
  try {
    // Найдем последние генерации и транзакции кредитов
    const recentGenerations = await prisma.generation.findMany({
      select: {
        id: true,
        userId: true,
        model: true,
        status: true,
        creditsUsed: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            totalCredits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('🔍 Последние 10 генераций:');
    recentGenerations.forEach((gen, index) => {
      console.log(`${index + 1}. ${gen.user.email}`);
      console.log(`   📝 ID генерации: ${gen.id}`);
      console.log(`   🤖 Модель: ${gen.model}`);
      console.log(`   📊 Статус: ${gen.status}`);
      console.log(`   💰 Использовано кредитов: ${gen.creditsUsed}`);
      console.log(`   👤 Текущие кредиты пользователя: ${gen.user.totalCredits}`);
      console.log(`   📅 Создано: ${gen.createdAt}`);
      console.log('   ---');
    });

    // Проверим, есть ли у нас проблемные транзакции
    const failedGenerations = await prisma.generation.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      },
      select: {
        id: true,
        userId: true,
        model: true,
        creditsUsed: true,
        user: {
          select: {
            email: true,
            totalCredits: true
          }
        }
      }
    });

    if (failedGenerations.length > 0) {
      console.log('\n❌ Неудачные генерации за последние 24 часа (возможно, кредиты не были возвращены):');
      failedGenerations.forEach(gen => {
        console.log(`   📧 ${gen.user.email}: потеряно ${gen.creditsUsed} кредитов (ID: ${gen.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке генераций:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentGenerations();