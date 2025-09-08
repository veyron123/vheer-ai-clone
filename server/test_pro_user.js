import { PrismaClient } from '@prisma/client';
import { shouldSaveImageForUser } from './utils/imageStorage.js';

const prisma = new PrismaClient();

async function testProUser() {
  try {
    console.log('🧪 Testing Pro user image saving functionality...\n');
    
    // Get Pro user
    const user = await prisma.user.findUnique({
      where: { email: 'pandadroid@inbox.ru' },
      include: {
        subscription: true,
        images: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Info:');
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Credits:', user.totalCredits);
    console.log('  Subscription Plan:', user.subscription?.plan);
    console.log('  Subscription Status:', user.subscription?.status);
    
    // Test shouldSaveImageForUser function
    const canSaveImages = shouldSaveImageForUser(user);
    console.log('\n🖼️ Image saving check:');
    console.log('  Can save images:', canSaveImages ? '✅ YES' : '❌ NO');
    
    if (!canSaveImages) {
      console.log('  ⚠️  PROBLEM: User should be able to save images but function returns false!');
      
      // Debug the function
      console.log('\n🔍 Debugging shouldSaveImageForUser:');
      console.log('  user.email:', user.email);
      console.log('  user.username:', user.username);
      console.log('  user.subscription:', !!user.subscription);
      console.log('  user.subscription.plan:', user.subscription?.plan);
      console.log('  Plan !== FREE:', user.subscription?.plan !== 'FREE');
    }
    
    // Check existing saved images
    console.log('\n🖼️ Current saved images count:', user.images?.length || 0);
    
    if (user.images && user.images.length > 0) {
      console.log('\n📋 Recent images:');
      user.images.slice(0, 5).forEach((image, index) => {
        console.log(`  ${index + 1}. ${image.createdAt.toISOString()} - ${image.url.substring(0, 60)}...`);
        console.log(`     cloudPath: ${image.cloudPath || 'NULL'}`);
      });
    }
    
    // Check if user has any generations
    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n🎨 Recent generations count:', generations.length);
    
    if (generations.length > 0) {
      console.log('\n📋 Recent generations:');
      generations.slice(0, 3).forEach((gen, index) => {
        console.log(`  ${index + 1}. ${gen.createdAt.toISOString()} - ${gen.model} - ${gen.status}`);
        console.log(`     Prompt: ${gen.prompt?.substring(0, 50)}...`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testProUser();