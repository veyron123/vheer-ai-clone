import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecords() {
  try {
    console.log('=== DATABASE INVESTIGATION ===\n');
    
    // Get all users with their totals
    console.log('👥 ALL USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        totalCredits: true,
        createdAt: true,
        updatedAt: true,
        lastCreditUpdate: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
      console.log(`  Credits: ${user.totalCredits}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log(`  Last Credit Update: ${user.lastCreditUpdate.toISOString()}\n`);
    });
    
    // Get all payments
    console.log('💳 ALL PAYMENTS:');
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    payments.forEach(payment => {
      console.log(`- Payment ID: ${payment.id}`);
      console.log(`  User: ${payment.user.email}`);
      console.log(`  Amount: ${payment.amount} ${payment.currency}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Description: ${payment.description}`);
      console.log(`  Created: ${payment.createdAt.toISOString()}\n`);
    });
    
    // Get all credits
    console.log('🪙 ALL CREDIT TRANSACTIONS:');
    const credits = await prisma.credit.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    credits.forEach(credit => {
      console.log(`- Credit ID: ${credit.id}`);
      console.log(`  User: ${credit.user.email}`);
      console.log(`  Amount: ${credit.amount}`);
      console.log(`  Type: ${credit.type}`);
      console.log(`  Description: ${credit.description}`);
      console.log(`  Created: ${credit.createdAt.toISOString()}\n`);
    });
    
    // Get all subscriptions
    console.log('📄 ALL SUBSCRIPTIONS:');
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    subscriptions.forEach(sub => {
      console.log(`- Subscription ID: ${sub.id}`);
      console.log(`  User: ${sub.user.email}`);
      console.log(`  Plan: ${sub.plan}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Period End: ${sub.currentPeriodEnd?.toISOString() || 'None'}`);
      console.log(`  Created: ${sub.createdAt.toISOString()}\n`);
    });
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`- Total Users: ${users.length}`);
    console.log(`- Total Payments: ${payments.length}`);
    console.log(`- Total Credit Transactions: ${credits.length}`);
    console.log(`- Total Subscriptions: ${subscriptions.length}`);
    console.log(`- Successful Payments: ${payments.filter(p => p.status === 'COMPLETED').length}`);
    console.log(`- Failed Payments: ${payments.filter(p => p.status === 'FAILED').length}`);
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecords();