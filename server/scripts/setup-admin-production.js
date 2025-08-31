import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminProduction() {
  try {
    console.log('🚀 Setting up admin user for production...');
    
    const adminEmail = 'unitradacergo@gmail.com';
    
    // Check if admin user exists
    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!user) {
      console.log('❌ Admin user not found! Creating...');
      
      // Generate a secure random password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          username: 'admin',
          fullName: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          totalCredits: 50000,
          emailVerified: true
        }
      });
      
      console.log('✅ Admin user created!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Temporary password: ${tempPassword}`);
      console.log('⚠️  Please change this password after first login!');
      
    } else {
      console.log('👤 Admin user exists, checking role...');
      
      if (user.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        });
        console.log('✅ Role updated to ADMIN');
      } else {
        console.log('✅ User already has ADMIN role');
      }
    }
    
    console.log('\n🎯 Admin setup complete!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Role: ADMIN`);
    console.log(`   Credits: ${user.totalCredits}`);
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (process.argv[1].includes('setup-admin-production')) {
  setupAdminProduction();
}

export default setupAdminProduction;