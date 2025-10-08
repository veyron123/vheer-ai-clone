import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function debugSubscriptionIssue() {
  try {
    console.log('🔍 Диагностика проблемы с подписками...\n');

    // 1. Проверить всех пользователей с подписками
    console.log('1️⃣ Проверка пользователей с подписками:');
    const usersWithSubscriptions = await prisma.user.findMany({
      where: {
        subscription: {
          isNot: null
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        totalCredits: true,
        subscription: true,
        createdAt: true
      }
    });

    console.log(`Найдено ${usersWithSubscriptions.length} пользователей с подписками:\n`);

    for (const user of usersWithSubscriptions) {
      console.log(`👤 Пользователь: ${user.username || user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Кредиты: ${user.totalCredits}`);
      console.log(`   План подписки: ${user.subscription.plan}`);
      console.log(`   Статус подписки: ${user.subscription.status}`);
      console.log(`   Дата создания: ${user.subscription.createdAt}`);
      console.log(`   Дата обновления: ${user.subscription.updatedAt}`);

      if (user.subscription.wayforpayOrderReference) {
        console.log(`   WayForPay Order Ref: ${user.subscription.wayforpayOrderReference}`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 2. Проверить платежи за последние 30 дней
    console.log('\n2️⃣ Проверка платежей за последние 30 дней:');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            subscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Найдено ${recentPayments.length} успешных платежей:\n`);

    for (const payment of recentPayments) {
      console.log(`💳 Платеж: ${payment.id}`);
      console.log(`   Пользователь: ${payment.user.username || payment.user.email}`);
      console.log(`   Сумма: ${payment.amount} ${payment.currency}`);
      console.log(`   Статус: ${payment.status}`);
      console.log(`   Описание: ${payment.description}`);
      console.log(`   Дата: ${payment.createdAt}`);

      if (payment.user.subscription) {
        console.log(`   Текущая подписка: ${payment.user.subscription.plan} (${payment.user.subscription.status})`);
      } else {
        console.log(`   ❌ У пользователя нет активной подписки!`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 3. Проверить кредитные транзакции за последние 30 дней
    console.log('\n3️⃣ Проверка кредитных транзакций за последние 30 дней:');
    const recentCredits = await prisma.credit.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        type: 'PURCHASE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            subscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Найдено ${recentCredits.length} кредитных транзакций:\n`);

    for (const credit of recentCredits) {
      console.log(`🎫 Кредитная транзакция: ${credit.id}`);
      console.log(`   Пользователь: ${credit.user.username || credit.user.email}`);
      console.log(`   Сумма кредитов: ${credit.amount}`);
      console.log(`   Тип: ${credit.type}`);
      console.log(`   Описание: ${credit.description}`);
      console.log(`   Дата: ${credit.createdAt}`);

      if (credit.user.subscription) {
        console.log(`   Подписка пользователя: ${credit.user.subscription.plan} (${credit.user.subscription.status})`);
      } else {
        console.log(`   ❌ У пользователя нет подписки!`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 4. Найти пользователей, которые оплатили подписку но не получили кредиты
    console.log('\n4️⃣ Поиск пользователей с проблемами подписок:');

    // Пользователи с активными подписками но низкими кредитами
    const usersWithActiveSubs = await prisma.user.findMany({
      where: {
        subscription: {
          status: 'ACTIVE',
          plan: {
            in: ['BASIC', 'PRO', 'ENTERPRISE']
          }
        },
        totalCredits: {
          lt: 100 // Меньше 100 кредитов может указывать на проблему
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        totalCredits: true,
        subscription: true
      }
    });

    if (usersWithActiveSubs.length > 0) {
      console.log(`\n⚠️ Найдено ${usersWithActiveSubs.length} пользователей с активными подписками но низкими кредитами:\n`);

      for (const user of usersWithActiveSubs) {
        console.log(`🚨 ПРОБЛЕМА: ${user.username || user.email}`);
        console.log(`   План: ${user.subscription.plan}`);
        console.log(`   Кредиты: ${user.totalCredits}`);
        console.log(`   Ожидаемые кредиты: ${getExpectedCredits(user.subscription.plan)}`);
        console.log(`   Рекомендация: Добавить ${getExpectedCredits(user.subscription.plan) - user.totalCredits} кредитов`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    } else {
      console.log('\n✅ Все пользователи с активными подписками имеют достаточное количество кредитов');
    }

    // 5. Проверить пользователей без подписок но с кредитами
    console.log('\n5️⃣ Проверка пользователей без подписок:');
    const usersWithoutSubs = await prisma.user.findMany({
      where: {
        subscription: null,
        totalCredits: {
          gt: 100 // Больше 100 кредитов без подписки
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        totalCredits: true,
        createdAt: true
      },
      take: 10
    });

    if (usersWithoutSubs.length > 0) {
      console.log(`\n📝 Найдено ${usersWithoutSubs.length} пользователей без подписок но с кредитами:\n`);

      for (const user of usersWithoutSubs) {
        console.log(`👤 ${user.username || user.email}: ${user.totalCredits} кредитов`);
      }
    } else {
      console.log('\n✅ Нет пользователей с подозрительно большим количеством кредитов без подписки');
    }

  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getExpectedCredits(plan) {
  const planCredits = {
    'BASIC': 800,
    'PRO': 3000,
    'ENTERPRISE': 15000
  };
  return planCredits[plan] || 0;
}

debugSubscriptionIssue();
