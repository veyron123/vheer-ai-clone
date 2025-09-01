import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🚀 Setting up admin user...');
    
    const adminEmail = 'unitradecargo@gmail.com';
    const newPassword = 'admin123'; // Simple password for now
    
    // Check if admin user exists
    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!user) {
      console.log('❌ Admin user not found! Creating...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
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
      console.log(`🔑 Password: ${newPassword}`);
      
    } else {
      console.log('👤 Admin user exists, updating password and role...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      user = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          totalCredits: 50000,
          emailVerified: true
        }
      });
      
      console.log('✅ Admin user updated!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log(`👑 Role: ${user.role}`);
      console.log(`💰 Credits: ${user.totalCredits}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();