const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🕵️ Debugging cancellation issue...');
  console.log('='.repeat(50));
  
  const email = 'oksanahavryliak1965@gmail.com';
  
  // Get the subscription details
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true }
  });
  
  if (!user || !user.subscription) {
    console.log('❌ User or subscription not found');
    return;
  }
  
  const sub = user.subscription;
  
  console.log('📊 Current State:');
  console.log(`👤 User: ${user.email}`);
  console.log(`📊 Plan: ${sub.plan}`);
  console.log(`✅ Status: ${sub.status}`);
  console.log(`🔑 OrderRef: ${sub.wayforpayOrderReference}`);
  console.log(`📅 Created: ${sub.createdAt}`);
  console.log(`📅 Updated: ${sub.updatedAt}`);
  console.log(`🚫 Cancelled: ${sub.cancelledAt}`);
  
  console.log('\n🔍 Analysis:');
  
  // Check if cancelledAt exists but status/plan haven't changed
  if (sub.cancelledAt && sub.status === 'ACTIVE' && sub.plan !== 'FREE') {
    console.log('🚨 PROBLEM IDENTIFIED:');
    console.log('   ✅ CancelledAt timestamp exists');
    console.log('   ❌ Status is still ACTIVE (should be CANCELLED)');
    console.log('   ❌ Plan is still BASIC (should be FREE)');
    console.log('');
    console.log('💡 This suggests the cancellation process started but failed to complete');
    console.log('   The cancelledAt was set, but the status/plan update failed');
    
    // Check if there are any database constraints or issues
    console.log('\n🔧 Attempting manual fix...');
    
    try {
      const fixedSub = await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          status: 'CANCELLED',
          plan: 'FREE'
        }
      });
      
      console.log('✅ MANUAL FIX SUCCESSFUL!');
      console.log(`   Status: ${fixedSub.status}`);
      console.log(`   Plan: ${fixedSub.plan}`);
      console.log(`   Updated: ${fixedSub.updatedAt}`);
      
      console.log('\n📋 Fix Applied:');
      console.log('   ✅ Status changed from ACTIVE to CANCELLED');
      console.log('   ✅ Plan changed from BASIC to FREE');
      console.log('   ✅ CancelledAt timestamp preserved');
      
    } catch (error) {
      console.log('❌ MANUAL FIX FAILED:', error.message);
      console.log('   Database constraints may be preventing the update');
    }
    
  } else if (sub.status === 'CANCELLED' && sub.plan === 'FREE') {
    console.log('✅ SUBSCRIPTION PROPERLY CANCELLED');
    console.log('   Status: CANCELLED ✓');
    console.log('   Plan: FREE ✓');
    console.log('   CancelledAt: Set ✓');
  }
  
  // Check recent database activity
  console.log('\n📈 Recent Database Activity:');
  const recentActivity = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 1
  });
  
  if (recentActivity.length > 0) {
    const latest = recentActivity[0];
    const timeDiff = new Date() - new Date(latest.updatedAt);
    const minutesAgo = Math.floor(timeDiff / 60000);
    
    console.log(`📅 Last Update: ${minutesAgo} minutes ago`);
    console.log(`🔄 Last Status: ${latest.status}`);
    console.log(`📊 Last Plan: ${latest.plan}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());