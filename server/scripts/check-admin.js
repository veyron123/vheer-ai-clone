import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user...');
    
    const adminEmail = 'unitradacergo@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        totalCredits: true,
        createdAt: true
      }
    });
    
    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Creating admin user...');
      
      // Create admin user if doesn't exist
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          username: 'admin',
          fullName: 'Admin User',
          role: 'ADMIN',
          totalCredits: 10000,
          emailVerified: true,
          password: 'hashed_password_placeholder' // This should be properly hashed
        }
      });
      
      console.log('✅ Admin user created:', newAdmin);
    } else {
      console.log('👤 User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Credits: ${user.totalCredits}`);
      
      if (user.role !== 'ADMIN') {
        console.log('⚠️  User is not admin! Updating role...');
        
        const updated = await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        });
        
        console.log('✅ Role updated to ADMIN');
      } else {
        console.log('✅ User already has ADMIN role');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();