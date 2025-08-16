const { PrismaClient } = require('@prisma/client');

// Set SQLite database path
process.env.DATABASE_URL = "file:./prisma/dev.db";

const prisma = new PrismaClient();

async function checkCredits() {
  try {
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
      console.log('User found:');
      console.log('- ID:', user.id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Total Credits:', user.totalCredits);
      
      console.log('\nModel costs:');
      console.log('- flux-pro: 10 credits');
      console.log('- flux-max: 20 credits');
      console.log('- gpt-image: 30 credits');
      
      console.log('\nCan afford:');
      console.log('- flux-pro:', user.totalCredits >= 10 ? '✅ Yes' : '❌ No');
      console.log('- flux-max:', user.totalCredits >= 20 ? '✅ Yes' : '❌ No');
      console.log('- gpt-image:', user.totalCredits >= 30 ? '✅ Yes' : '❌ No');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCredits();