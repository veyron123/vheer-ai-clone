import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCredits() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        totalCredits: true,
        lastCreditUpdate: true,
        createdAt: true
      }
    });
    
    console.log('🔍 Текущие пользователи и их кредиты:');
    users.forEach(user => {
      console.log(`📧 ${user.email || user.username || user.id}`);
      console.log(`   💰 Кредиты: ${user.totalCredits}`);
      console.log(`   📅 Последнее обновление: ${user.lastCreditUpdate}`);
      console.log(`   🗓️ Создан: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // Найдем самого последнего пользователя (скорее всего, это вы)
    const latestUser = users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (latestUser) {
      console.log('👤 Последний пользователь (возможно, ваш аккаунт):');
      console.log(`   ID: ${latestUser.id}`);
      console.log(`   Email: ${latestUser.email}`);
      console.log(`   Кредиты: ${latestUser.totalCredits}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке кредитов:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCredits();