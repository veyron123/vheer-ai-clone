const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function giveMaximumPlan() {
  try {
    const userId = 'cmeiiqjrb0000ef1lt2m3oarq';
    
    console.log('🔍 Поиск пользователя...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        username: true, 
        email: true,
        totalCredits: true,
        subscription: true
      }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('👤 Пользователь найден:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Текущие кредиты:', user.totalCredits);
    console.log('- Текущая подписка:', user.subscription);
    
    // Обновляем подписку на ENTERPRISE (Maximum)
    console.log('\n🔄 Обновление подписки на Maximum (ENTERPRISE)...');
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: {
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          credits: 15000, // Добавляем кредиты согласно плану
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 год
          lastPayment: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
          orderRef: 'MANUAL_GRANT_MAXIMUM'
        },
        totalCredits: {
          increment: 15000 // Добавляем 15000 кредитов
        }
      },
      select: {
        id: true,
        email: true,
        totalCredits: true,
        subscription: true,
        updatedAt: true
      }
    });
    
    console.log('\n✅ Подписка успешно обновлена!');
    console.log('📊 Новые данные пользователя:');
    console.log('- Email:', updatedUser.email);
    console.log('- Общие кредиты:', updatedUser.totalCredits);
    console.log('- План подписки:', updatedUser.subscription.plan);
    console.log('- Статус подписки:', updatedUser.subscription.status);
    console.log('- Кредиты по подписке:', updatedUser.subscription.credits);
    console.log('- Дата начала:', updatedUser.subscription.startDate);
    console.log('- Дата окончания:', updatedUser.subscription.endDate);
    
    console.log('\n🎁 Что входит в план Maximum:');
    console.log('- 15,000 кредитов при покупке');
    console.log('- Все модели AI');
    console.log('- Неограниченное разрешение');
    console.log('- Приоритетная поддержка');
    console.log('- Командная работа');
    console.log('- Пользовательские интеграции');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

giveMaximumPlan();
