import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserCredits() {
  try {
    console.log('🔍 Checking credits for unitradecargo user...');
    
    // Find the user by username pattern
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: 'unitradecargo' } },
          { email: 'unitradecargo@gmail.com' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        totalCredits: true,
        lastCreditUpdate: true,
        createdAt: true,
        role: true,
        subscription: true
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Current Credits: ${user.totalCredits}`);
    console.log(`   Last Credit Update: ${user.lastCreditUpdate}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Subscription: ${user.subscription?.plan || 'FREE'}`);

    // Check credit history
    console.log('\n📊 Credit History (last 10 transactions):');
    const creditHistory = await prisma.credit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        amount: true,
        type: true,
        description: true,
        createdAt: true
      }
    });

    if (creditHistory.length === 0) {
      console.log('   No credit transactions found');
    } else {
      creditHistory.forEach((credit, index) => {
        const sign = credit.amount > 0 ? '+' : '';
        console.log(`   ${index + 1}. ${sign}${credit.amount} credits - ${credit.type} - ${credit.description} (${credit.createdAt})`);
      });
    }

    // Check recent generations
    console.log('\n🎨 Recent Generations (last 5):');
    const recentGenerations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        model: true,
        status: true,
        creditsUsed: true,
        createdAt: true,
        prompt: true
      }
    });

    if (recentGenerations.length === 0) {
      console.log('   No generations found');
    } else {
      recentGenerations.forEach((gen, index) => {
        console.log(`   ${index + 1}. ${gen.model} - ${gen.status} - ${gen.creditsUsed} credits - ${gen.createdAt}`);
        console.log(`      Prompt: ${gen.prompt?.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking user credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCredits();