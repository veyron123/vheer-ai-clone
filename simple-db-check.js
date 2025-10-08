import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function simpleDbCheck() {
  try {
    console.log('🔍 Простая проверка базы данных...\n');

    // 1. Подсчитать общее количество пользователей
    const totalUsers = await prisma.user.count();
    console.log(`👥 Всего пользователей: ${totalUsers}`);

    // 2. Подсчитать пользователей с подписками
    const usersWithSubs = await prisma.user.count({
      where: {
        subscription: {
          isNot: null
        }
      }
    });
    console.log(`📋 Пользователей с подписками: ${usersWithSubs}`);

    // 3. Подсчитать активные подписки
    const activeSubs = await prisma.subscription.count({
      where: {
        status: 'ACTIVE'
      }
    });
    console.log(`✅ Активных подписок: ${activeSubs}`);

    // 4. Показать последние платежи
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            subscription: {
              select: {
                plan: true,
                status: true
              }
            }
          }
        }
      }
    });

    console.log('\n💳 Последние платежи:');
    recentPayments.forEach(payment => {
      console.log(`   ${payment.id}: ${payment.amount} ${payment.currency} (${payment.status}) - ${payment.user.email}`);
      if (payment.user.subscription) {
        console.log(`     Подписка: ${payment.user.subscription.plan} (${payment.user.subscription.status})`);
      }
    });

    // 5. Показать последние кредитные транзакции
    const recentCredits = await prisma.credit.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        amount: true,
        type: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            subscription: {
              select: {
                plan: true,
                status: true
              }
            }
          }
        }
      }
    });

    console.log('\n🎫 Последние кредитные транзакции:');
    recentCredits.forEach(credit => {
      console.log(`   ${credit.id}: +${credit.amount} кредитов (${credit.type}) - ${credit.user.email}`);
      if (credit.user.subscription) {
        console.log(`     Подписка: ${credit.user.subscription.plan} (${credit.user.subscription.status})`);
      }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleDbCheck();
