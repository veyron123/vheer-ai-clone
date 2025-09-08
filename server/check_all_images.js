import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllImages() {
  try {
    console.log('🔍 Checking all images in database...\n');
    
    // Get all images ordered by creation date
    const allImages = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        }
      },
      take: 20
    });
    
    console.log(`📊 Total images in database: ${allImages.length}\n`);
    
    if (allImages.length > 0) {
      console.log('📋 Recent images:');
      allImages.forEach((image, index) => {
        console.log(`${index + 1}. ID: ${image.id}`);
        console.log(`   User: ${image.user.email} (${image.user.username})`);
        console.log(`   Created: ${image.createdAt.toISOString()}`);
        console.log(`   URL: ${image.url?.substring(0, 60)}...`);
        console.log(`   CloudPath: ${image.cloudPath || 'NULL'}`);
        console.log(`   Model: ${image.model || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check specifically for Pro user images
    const proUserImages = await prisma.image.findMany({
      where: {
        user: {
          email: 'pandadroid@inbox.ru'
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎯 Pro user (pandadroid@inbox.ru) images: ${proUserImages.length}\n`);
    
    if (proUserImages.length > 0) {
      console.log('📋 Pro user images:');
      proUserImages.forEach((image, index) => {
        console.log(`${index + 1}. ID: ${image.id}`);
        console.log(`   Created: ${image.createdAt.toISOString()}`);
        console.log(`   URL: ${image.url?.substring(0, 60)}...`);
        console.log(`   CloudPath: ${image.cloudPath || 'NULL'}`);
        console.log(`   Model: ${image.model || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check images with IMGBB cloudPath
    const imgbbImages = await prisma.image.findMany({
      where: {
        cloudPath: {
          startsWith: 'imgbb/'
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📤 IMGBB images: ${imgbbImages.length}\n`);
    
    if (imgbbImages.length > 0) {
      console.log('📋 IMGBB images:');
      imgbbImages.forEach((image, index) => {
        console.log(`${index + 1}. ID: ${image.id}`);
        console.log(`   Created: ${image.createdAt.toISOString()}`);
        console.log(`   CloudPath: ${image.cloudPath}`);
        console.log(`   URL: ${image.url?.substring(0, 60)}...`);
        console.log('');
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkAllImages();