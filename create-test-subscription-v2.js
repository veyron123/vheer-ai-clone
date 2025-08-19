const { PrismaClient } = require('./server/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Creating test user with subscription for cancellation testing v2...');
  
  const testEmail = 'cancellation-test-v2@example.com';
  const testPassword = 'TestPass123!';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  // Delete existing test user if exists
  await prisma.user.deleteMany({ where: { email: testEmail } });
  
  // Create test user with subscription
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      username: 'cancellation-test-v2',
      password: hashedPassword,
      emailVerified: true,
      totalCredits: 100,
      subscription: {
        create: {
          plan: 'BASIC',
          status: 'ACTIVE',
          wayforpayOrderReference: 'TEST-CANCEL-V2-12345', // Fake reference for testing
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    },
    include: {
      subscription: true
    }
  });
  
  console.log('✅ Test user created successfully:');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log(`📊 Plan: ${user.subscription.plan}`);
  console.log(`✅ Status: ${user.subscription.status}`);
  console.log(`🔑 OrderRef: ${user.subscription.wayforpayOrderReference}`);
  console.log('');
  console.log('🚀 Ready for cancellation testing!');
  console.log('   1. Login with the credentials above');
  console.log('   2. Go to profile page');
  console.log('   3. Click "Cancel Subscription" button');
  console.log('   4. Check server logs for detailed cancellation process');
  console.log('   5. Verify status changes to CANCELLED and plan to FREE');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());