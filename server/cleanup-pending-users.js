import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupPendingUsers() {
  try {
    console.log('🔍 Searching for Pending Customer Info users...');
    
    // Find all users with "Pending Customer Info" in fullName
    const pendingUsers = await prisma.user.findMany({
      where: {
        fullName: {
          contains: 'Pending Customer Info',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Created: ${user.createdAt}`);
    });
    
    if (pendingUsers.length === 0) {
      console.log('✅ No pending users found to delete.');
      return;
    }
    
    console.log('🗑️ Deleting pending users...');
    
    // Delete all pending users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        fullName: {
          contains: 'Pending Customer Info',
          mode: 'insensitive'
        }
      }
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.count} pending users`);
    
    // Show remaining user count
    const remainingUsers = await prisma.user.count();
    console.log(`📈 Total users remaining: ${remainingUsers}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up pending users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPendingUsers();