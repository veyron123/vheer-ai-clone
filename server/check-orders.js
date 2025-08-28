import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentOrders() {
  try {
    console.log('🔍 Checking recent CartOrder entries...\n');
    
    // Get all cart orders sorted by creation date
    const cartOrders = await prisma.cartOrder.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    console.log(`Found ${cartOrders.length} cart orders:\n`);
    
    cartOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderReference}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Email: ${order.customerEmail || order.user?.email || 'N/A'}`);
      console.log(`   Amount: ${order.amount} ${order.currency}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   Transaction Status: ${order.transactionStatus || 'N/A'}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Items: ${JSON.stringify(order.items, null, 2)}`);
      console.log('   ---');
    });

    // Check if there are any orders in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentOrders = await prisma.cartOrder.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📅 Orders in last 24 hours: ${recentOrders.length}`);
    
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentOrders();