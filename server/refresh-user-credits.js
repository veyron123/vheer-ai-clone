import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function refreshUserCredits() {
  try {
    console.log('🔄 Refreshing credits for unitradecargo user...');
    
    const user = await prisma.user.findFirst({
      where: {
        username: { contains: 'unitradecargo' }
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`👤 Found user: ${user.username}`);
    console.log(`💰 Current credits: ${user.totalCredits}`);

    // Force update to ensure credits are reflected properly
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalCredits: user.totalCredits, // Same value but force DB update
        lastCreditUpdate: new Date()
      }
    });

    console.log('✅ Credits refreshed successfully!');
    console.log(`💰 Confirmed credits: ${updatedUser.totalCredits}`);

  } catch (error) {
    console.error('❌ Error refreshing credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

refreshUserCredits();