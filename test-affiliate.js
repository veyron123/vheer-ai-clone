import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestAffiliateData() {
  try {
    console.log('🧪 Создаю тестовые данные для партнерской программы...');

    // 1. Создаю тестового пользователя
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    const testUser = await prisma.user.create({
      data: {
        email: 'test_affiliate@example.com',
        username: `affiliate_${crypto.randomBytes(4).toString('hex')}`,
        password: hashedPassword,
        fullName: 'Test Affiliate User',
        role: 'USER',
        totalCredits: 100,
        emailVerified: true
      }
    });

    console.log('✅ Тестовый пользователь создан:', testUser.email);

    // 2. Создаю партнерский аккаунт
    const affiliateCode = `TEST${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: testUser.id,
        code: affiliateCode,
        commissionRate: 20.0,
        status: 'active',
        tier: 'starter'
      }
    });

    console.log('✅ Партнерский аккаунт создан с кодом:', affiliateCode);

    // 3. Создаю тестовую ссылку с Sub ID
    const subId = `test-${Date.now()}`;
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        alias: `test-link-${Date.now()}`,
        url: `http://localhost:5178/?ref=${affiliateCode}&fp_sid=${subId}`,
        isDefault: true,
        isActive: true
      }
    });

    console.log('✅ Партнерская ссылка создана:', affiliateLink.url);

    // 4. Создаю тестовый клик
    const testClick = await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        linkId: affiliateLink.id,
        sessionId: `test_session_${Date.now()}`,
        ipAddress: '127.0.0.1',
        userAgent: 'Test-Agent/1.0',
        referer: 'https://google.com',
        landingPage: 'http://localhost:5178/',
        utmSource: 'test',
        utmMedium: 'affiliate',
        utmCampaign: 'test-campaign',
        subId: subId,
        country: 'UA',
        city: 'Kiev',
        deviceType: 'desktop'
      }
    });

    console.log('✅ Тестовый клик создан');

    // 5. Создаю тестового рефирированного пользователя
    const referredUser = await prisma.user.create({
      data: {
        email: 'referred_user@example.com',
        username: `referred_${crypto.randomBytes(4).toString('hex')}`,
        password: hashedPassword,
        fullName: 'Referred Test User',
        role: 'USER',
        totalCredits: 100,
        emailVerified: true
      }
    });

    console.log('✅ Рефирированный пользователь создан:', referredUser.email);

    // 6. Создаю реферальную запись
    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        userId: referredUser.id,
        linkId: affiliateLink.id,
        clickId: testClick.id,
        status: 'signup',
        lifetimeValue: 0.0
      }
    });

    console.log('✅ Реферальная запись создана');

    // 7. Обновляю статистику ссылки
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        clickCount: 1,
        conversionCount: 1
      }
    });

    console.log('✅ Статистика ссылки обновлена');

    // 8. Создаю дневную статистику
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.affiliateStatDaily.create({
      data: {
        affiliateId: affiliate.id,
        date: today,
        clicks: 1,
        uniqueClicks: 1,
        signups: 1,
        customers: 0,
        revenue: 0.0,
        commissions: 0.0
      }
    });

    console.log('✅ Дневная статистика создана');

    console.log('\n🎉 Тестовые данные успешно созданы!');
    console.log('========================================');
    console.log(`📧 Email партнера: ${testUser.email}`);
    console.log(`🔑 Пароль: testpass123`);
    console.log(`🏷️  Партнерский код: ${affiliateCode}`);
    console.log(`🔗 Тестовая ссылка: ${affiliateLink.url}`);
    console.log(`📊 Sub ID: ${subId}`);
    console.log(`👤 Рефирированный пользователь: ${referredUser.email}`);
    console.log('========================================');

    return {
      affiliate: testUser,
      affiliateCode,
      testLink: affiliateLink.url,
      subId,
      referredUser
    };

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаю создание тестовых данных
createTestAffiliateData().catch(console.error);