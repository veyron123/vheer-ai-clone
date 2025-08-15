import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserCredits() {
  try {
    console.log('Updating user credits from 10 to 100...');
    
    // Обновляем всех пользователей с 10 кредитами до 100
    const updateResult = await prisma.user.updateMany({
      where: {
        totalCredits: {
          lte: 10 // Обновляем пользователей у которых 10 или меньше кредитов
        }
      },
      data: {
        totalCredits: 100
      }
    });
    
    console.log(`Updated ${updateResult.count} users to have 100 credits`);
    
    // Получаем статистику
    const stats = await prisma.user.aggregate({
      _count: {
        id: true
      },
      _min: {
        totalCredits: true
      },
      _max: {
        totalCredits: true
      },
      _avg: {
        totalCredits: true
      }
    });
    
    console.log('Credits statistics:', {
      totalUsers: stats._count.id,
      minCredits: stats._min.totalCredits,
      maxCredits: stats._max.totalCredits,
      avgCredits: Math.round(stats._avg.totalCredits || 0)
    });
    
  } catch (error) {
    console.error('Error updating user credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserCredits();