import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.favorite.deleteMany();
  await prisma.image.deleteMany();
  await prisma.generation.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.cartOrder.deleteMany();
  await prisma.cartSession.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@colibrrri.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      totalCredits: 10000,
      emailVerified: true,
      bio: 'Platform administrator',
      location: 'Global',
    },
  });

  // Create test users
  console.log('👥 Creating test users...');
  const testPassword = await bcrypt.hash('test123', 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        username: 'john_doe',
        password: testPassword,
        fullName: 'John Doe',
        totalCredits: 500,
        emailVerified: true,
        bio: 'Digital artist and AI enthusiast',
        location: 'New York, USA',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        username: 'jane_smith',
        password: testPassword,
        fullName: 'Jane Smith',
        totalCredits: 250,
        emailVerified: true,
        bio: 'Photographer exploring AI art',
        location: 'London, UK',
      },
    }),
    prisma.user.create({
      data: {
        email: 'artist@example.com',
        username: 'creative_artist',
        password: testPassword,
        fullName: 'Creative Artist',
        totalCredits: 100,
        emailVerified: false,
        bio: 'Experimenting with AI-generated art',
        location: 'Paris, France',
      },
    }),
  ]);

  // Create subscriptions
  console.log('💳 Creating subscriptions...');
  await prisma.subscription.create({
    data: {
      userId: users[0].id,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isRecurring: true,
      recurringMode: 'MONTHLY',
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: users[1].id,
      plan: 'STARTER',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create tags
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'portrait' } }),
    prisma.tag.create({ data: { name: 'landscape' } }),
    prisma.tag.create({ data: { name: 'abstract' } }),
    prisma.tag.create({ data: { name: 'realistic' } }),
    prisma.tag.create({ data: { name: 'fantasy' } }),
    prisma.tag.create({ data: { name: 'scifi' } }),
    prisma.tag.create({ data: { name: 'anime' } }),
    prisma.tag.create({ data: { name: 'cyberpunk' } }),
  ]);

  // Create generations and images
  console.log('🎨 Creating generations and images...');
  const models = ['flux', 'midjourney', 'dall-e-3', 'stable-diffusion', 'qwen'];
  const prompts = [
    'A serene mountain landscape at sunset with golden light',
    'Futuristic cyberpunk city with neon lights and flying cars',
    'Portrait of a wise wizard with magical aura',
    'Abstract art with vibrant colors and geometric shapes',
    'Underwater coral reef with tropical fish',
    'Medieval castle on a misty mountain',
    'Space station orbiting Earth',
    'Cherry blossom garden in spring',
    'Steampunk mechanical dragon',
    'Northern lights over snowy mountains',
  ];

  for (const user of [admin, ...users]) {
    // Create 2-5 generations per user
    const generationCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < generationCount; i++) {
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const batchSize = Math.floor(Math.random() * 3) + 1;

      const generation = await prisma.generation.create({
        data: {
          userId: user.id,
          prompt,
          model,
          batchSize,
          status: 'COMPLETED',
          creditsUsed: batchSize * 5,
          completedAt: new Date(),
        },
      });

      // Create images for this generation
      const imagePromises = [];
      for (let j = 0; j < batchSize; j++) {
        const isPublic = Math.random() > 0.3;
        const likes = isPublic ? Math.floor(Math.random() * 100) : 0;
        const views = isPublic ? Math.floor(Math.random() * 500) + likes : 0;

        imagePromises.push(
          prisma.image.create({
            data: {
              userId: user.id,
              generationId: generation.id,
              url: `https://via.placeholder.com/1024x1024/random?text=AI+Art+${i}${j}`,
              thumbnailUrl: `https://via.placeholder.com/256x256/random?text=AI+Art+${i}${j}`,
              prompt,
              model,
              width: 1024,
              height: 1024,
              seed: Math.floor(Math.random() * 1000000),
              steps: 30,
              guidance: 7.5,
              isPublic,
              likes,
              views,
              tags: {
                connect: tags
                  .sort(() => Math.random() - 0.5)
                  .slice(0, Math.floor(Math.random() * 3) + 1)
                  .map(tag => ({ id: tag.id })),
              },
            },
          })
        );
      }

      await Promise.all(imagePromises);
    }
  }

  // Create some favorites
  console.log('❤️ Creating favorites...');
  const publicImages = await prisma.image.findMany({
    where: { isPublic: true },
    take: 20,
  });

  for (const user of users) {
    const favoriteCount = Math.floor(Math.random() * 5) + 1;
    const imagesToFavorite = publicImages
      .sort(() => Math.random() - 0.5)
      .slice(0, favoriteCount);

    for (const image of imagesToFavorite) {
      if (image.userId !== user.id) {
        await prisma.favorite.create({
          data: {
            userId: user.id,
            imageId: image.id,
          },
        }).catch(() => {}); // Ignore if already favorited
      }
    }
  }

  // Create credit history
  console.log('💰 Creating credit history...');
  for (const user of users) {
    await prisma.credit.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'PURCHASE',
        description: 'Initial credit purchase',
      },
    });

    await prisma.credit.create({
      data: {
        userId: user.id,
        amount: -25,
        type: 'GENERATION',
        description: 'Image generation',
      },
    });
  }

  // Create sample payments
  console.log('💸 Creating payment history...');
  await prisma.payment.create({
    data: {
      userId: users[0].id,
      amount: 29.99,
      currency: 'USD',
      status: 'COMPLETED',
      wayforpayOrderReference: `WFP_${Date.now()}_1`,
      description: 'Pro subscription - Monthly',
    },
  });

  await prisma.payment.create({
    data: {
      userId: users[1].id,
      amount: 9.99,
      currency: 'USD',
      status: 'COMPLETED',
      wayforpayOrderReference: `WFP_${Date.now()}_2`,
      description: 'Starter subscription - Monthly',
    },
  });

  // Create sample cart order
  console.log('🛒 Creating sample cart order...');
  await prisma.cartOrder.create({
    data: {
      orderReference: `ORDER_${Date.now()}`,
      userId: users[0].id,
      amount: 149.99,
      currency: 'UAH',
      paymentStatus: 'PAID',
      orderStatus: 'PROCESSING',
      customerEmail: users[0].email,
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerPhone: '+1234567890',
      customerAddress: '123 Main St',
      customerCity: 'New York',
      customerCountry: 'USA',
      items: JSON.stringify([
        {
          image: publicImages[0].url,
          frameColor: 'black',
          size: '16x20',
          quantity: 1,
          price: 79.99,
        },
        {
          image: publicImages[1].url,
          frameColor: 'white',
          size: '12x16',
          quantity: 1,
          price: 69.99,
        },
      ]),
      paidAt: new Date(),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`
📊 Database Statistics:
- Admin users: 1
- Regular users: ${users.length}
- Total generations: ${await prisma.generation.count()}
- Total images: ${await prisma.image.count()}
- Public images: ${publicImages.length}
- Tags: ${tags.length}
- Favorites: ${await prisma.favorite.count()}
- Credits: ${await prisma.credit.count()}
- Payments: ${await prisma.payment.count()}
- Cart orders: ${await prisma.cartOrder.count()}

🔑 Login Credentials:
- Admin: admin@colibrrri.com / admin123
- Users: john@example.com, jane@example.com, artist@example.com / test123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });