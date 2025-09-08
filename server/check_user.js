import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'pandadroid@inbox.ru' },
      include: {
        subscription: true
      }
    });
    
    console.log('👤 Пользователь:', {
      email: user?.email,
      username: user?.username,
      totalCredits: user?.totalCredits,
      subscription: user?.subscription
    });
    
    if (user?.subscription) {
      console.log('📋 Подписка:', {
        plan: user.subscription.plan,
        status: user.subscription.status,
        endDate: user.subscription.endDate
      });
    }
    
    // Проверяем функцию shouldSaveImageForUser
    function shouldSaveImageForUser(user) {
      // Special case for admin user
      if (user.email === 'unitradecargo@gmail.com' || user.username?.includes('unitradecargo')) {
        console.log('✅ Admin user - image saving enabled');
        return true;
      }

      // Check if user has paid subscription
      if (user.subscription && user.subscription.plan !== 'FREE') {
        console.log('✅ Paid subscription - image saving enabled');
        return true;
      }

      console.log('❌ Free user - image saving disabled');
      return false;
    }
    
    const canSaveImages = shouldSaveImageForUser(user);
    console.log('🖼️ Может сохранять изображения:', canSaveImages);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка:', error);
    await prisma.$disconnect();
  }
}

checkUser();