import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCredits() {
  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: 'unitradecargo_1759565431778' },
      select: {
        id: true,
        username: true,
        email: true,
        totalCredits: true
      }
    });

    if (user) {
      console.log('Current user credits:', user.totalCredits);

      // Add 10000 credits
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { totalCredits: user.totalCredits + 10000 }
      });

      console.log('Updated user credits to:', updatedUser.totalCredits);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();