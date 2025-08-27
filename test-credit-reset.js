// Тестовый скрипт для проверки логики сброса кредитов

import { PrismaClient } from '@prisma/client';
import CreditService from './server/services/creditService.js';

const prisma = new PrismaClient();

async function testCreditReset() {
  console.log('🧪 Тестирование новой логики сброса кредитов...\n');
  
  try {
    // 1. Создаем тестовых пользователей с разными планами
    console.log('1️⃣ Создаем тестовых пользователей...');
    
    // Пользователь с FREE планом
    const freeUser = await prisma.user.upsert({
      where: { email: 'test-free@example.com' },
      update: {
        totalCredits: 250, // У него есть накопленные кредиты
        lastCreditUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000) // Обновлено 25 часов назад
      },
      create: {
        email: 'test-free@example.com',
        username: 'testfree',
        password: 'hashedpassword',
        totalCredits: 250,
        lastCreditUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
    });
    
    // Создаем/обновляем подписку для FREE пользователя
    await prisma.subscription.upsert({
      where: { userId: freeUser.id },
      update: { plan: 'FREE' },
      create: {
        userId: freeUser.id,
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });
    
    // Пользователь с PREMIUM планом
    const premiumUser = await prisma.user.upsert({
      where: { email: 'test-premium@example.com' },
      update: {
        totalCredits: 500,
        lastCreditUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000)
      },
      create: {
        email: 'test-premium@example.com',
        username: 'testpremium',
        password: 'hashedpassword',
        totalCredits: 500,
        lastCreditUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
    });
    
    await prisma.subscription.upsert({
      where: { userId: premiumUser.id },
      update: { plan: 'PREMIUM' },
      create: {
        userId: premiumUser.id,
        plan: 'PREMIUM',
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ Тестовые пользователи созданы');
    console.log(`  - FREE user: ${freeUser.email} (${freeUser.totalCredits} кредитов)`);
    console.log(`  - PREMIUM user: ${premiumUser.email} (${premiumUser.totalCredits} кредитов)\n`);
    
    // 2. Тестируем индивидуальный сброс для FREE пользователя
    console.log('2️⃣ Тестируем сброс кредитов для FREE пользователя...');
    const freeResult = await CreditService.addDailyCredits(freeUser.id);
    console.log('Результат для FREE пользователя:', freeResult);
    
    // 3. Тестируем попытку сброса для PREMIUM пользователя
    console.log('\n3️⃣ Тестируем попытку сброса для PREMIUM пользователя...');
    const premiumResult = await CreditService.addDailyCredits(premiumUser.id);
    console.log('Результат для PREMIUM пользователя:', premiumResult);
    
    // 4. Тестируем массовый сброс
    console.log('\n4️⃣ Тестируем массовый сброс кредитов...');
    const massResult = await CreditService.addDailyCreditsToAllUsers();
    console.log('Результат массового сброса:', {
      totalUsers: massResult.totalUsers,
      updatedUsers: massResult.updatedUsers,
      skippedUsers: massResult.skippedUsers
    });
    
    // 5. Проверяем финальные значения
    console.log('\n5️⃣ Проверяем финальные значения кредитов...');
    const finalFreeUser = await prisma.user.findUnique({
      where: { id: freeUser.id },
      include: { subscription: true }
    });
    const finalPremiumUser = await prisma.user.findUnique({
      where: { id: premiumUser.id },
      include: { subscription: true }
    });
    
    console.log(`FREE пользователь (${finalFreeUser.subscription.plan}):`, {
      было: 250,
      стало: finalFreeUser.totalCredits,
      ожидалось: 100
    });
    
    console.log(`PREMIUM пользователь (${finalPremiumUser.subscription.plan}):`, {
      было: 500,
      стало: finalPremiumUser.totalCredits,
      ожидалось: 500
    });
    
    // Проверка результатов
    console.log('\n📊 Итоги теста:');
    const freeTestPassed = finalFreeUser.totalCredits === 100;
    const premiumTestPassed = finalPremiumUser.totalCredits === 500;
    
    console.log(`  - FREE план сбрасывается до 100: ${freeTestPassed ? '✅ ПРОЙДЕНО' : '❌ ПРОВАЛЕНО'}`);
    console.log(`  - PREMIUM план не изменяется: ${premiumTestPassed ? '✅ ПРОЙДЕНО' : '❌ ПРОВАЛЕНО'}`);
    
    if (freeTestPassed && premiumTestPassed) {
      console.log('\n🎉 Все тесты успешно пройдены!');
    } else {
      console.log('\n⚠️ Некоторые тесты провалены.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тесты
testCreditReset();