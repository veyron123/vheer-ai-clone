import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAllCartOrders() {
  try {
    console.log('🔍 Searching for all cart orders...');
    
    // Count all cart orders first
    const totalOrders = await prisma.cartOrder.count();
    console.log(`📊 Found ${totalOrders} cart orders in total`);
    
    if (totalOrders === 0) {
      console.log('✅ No cart orders found to delete.');
      return;
    }
    
    // Show some sample cart orders
    const sampleOrders = await prisma.cartOrder.findMany({
      take: 5,
      select: {
        id: true,
        orderReference: true,
        orderStatus: true,
        amount: true,
        customerFirstName: true,
        customerLastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📋 Sample cart orders to be deleted:');
    sampleOrders.forEach(order => {
      console.log(`  - Order ${order.orderReference} - ${order.orderStatus} - $${order.amount} - ${order.customerFirstName} ${order.customerLastName} - ${order.createdAt}`);
    });
    
    console.log('🗑️ Deleting all cart orders...');
    
    // Delete all cart orders
    const deleteResult = await prisma.cartOrder.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.count} cart orders`);
    
    // Verify deletion
    const remainingOrders = await prisma.cartOrder.count();
    console.log(`📈 Cart orders remaining: ${remainingOrders}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllCartOrders();