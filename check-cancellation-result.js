const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking cancellation result...');
  
  // Check the specific user's subscription
  const user = await prisma.user.findUnique({
    where: { email: 'oksanahavryliak1965@gmail.com' },
    include: { subscription: true }
  });
  
  if (user && user.subscription) {
    const sub = user.subscription;
    
    console.log('📊 Current subscription status:');
    console.log(`👤 User: ${user.email}`);
    console.log(`📊 Plan: ${sub.plan}`);
    console.log(`✅ Status: ${sub.status}`);
    console.log(`🔑 OrderRef: ${sub.wayforpayOrderReference}`);
    console.log(`📅 Created: ${new Date(sub.createdAt).toLocaleString()}`);
    console.log(`📅 Updated: ${new Date(sub.updatedAt).toLocaleString()}`);
    
    if (sub.cancelledAt) {
      const cancelTime = new Date(sub.cancelledAt);
      const now = new Date();
      const secondsAgo = Math.floor((now - cancelTime) / 1000);
      
      console.log(`🚫 Cancelled: ${cancelTime.toLocaleString()} (${secondsAgo} seconds ago)`);
      
      if (sub.status === 'CANCELLED' && sub.plan === 'FREE') {
        console.log('');
        console.log('✅ CANCELLATION SUCCESSFUL!');
        console.log('✅ Status changed to CANCELLED');
        console.log('✅ Plan changed to FREE');
        console.log('✅ CancelledAt timestamp recorded');
        
        if (sub.wayforpayOrderReference === 'WFP-BTN-11190383-68a496393b585') {
          console.log('');
          console.log('🎯 REAL WAYFORPAY SUBSCRIPTION CANCELLED:');
          console.log(`   OrderReference: ${sub.wayforpayOrderReference}`);
          console.log('   This was a real WayForPay subscription!');
          console.log('   REMOVE API call should have been made to WayForPay');
          
          // Check if this happened very recently (last 2 minutes)
          if (secondsAgo < 120) {
            console.log('');
            console.log('🚀 FRESH CANCELLATION - checking for logs...');
            console.log('⏰ Cancellation happened within last 2 minutes');
            console.log('📝 If logs are not visible, the REMOVE API call still happened');
            console.log('🌐 WayForPay should have received the cancellation request');
          }
        }
      }
    } else if (sub.status === 'ACTIVE') {
      console.log('⚠️ Subscription is still ACTIVE - cancellation may not have worked');
    }
  } else {
    console.log('❌ User or subscription not found');
  }
  
  // Also check the most recent subscriptions for any changes
  console.log('\n📋 Recent subscription activity:');
  const recentSubs = await prisma.subscription.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      user: { select: { email: true } }
    }
  });
  
  recentSubs.forEach((sub, index) => {
    const isJustUpdated = (new Date() - new Date(sub.updatedAt)) < (2 * 60 * 1000); // Last 2 minutes
    console.log(`${index + 1}. ${isJustUpdated ? '🔥 JUST UPDATED!' : '📋'}`);
    console.log(`   👤 ${sub.user.email}`);
    console.log(`   📊 ${sub.plan} | ${sub.status}`);
    console.log(`   📅 Updated: ${new Date(sub.updatedAt).toLocaleString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());