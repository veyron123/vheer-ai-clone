import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCredits() {
  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: 'cmeb1954n000013lne7g5nmil' },
      select: { 
        id: true, 
        username: true, 
        email: true,
        totalCredits: true 
      }
    });
    
    if (user) {
      console.log('Current user credits:', user.totalCredits);
      
      // Add 1000 credits for testing
      const updatedUser = await prisma.user.update({
        where: { id: 'cmeb1954n000013lne7g5nmil' },
        data: { totalCredits: 1000 }
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