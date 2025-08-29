const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load production environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env.production') });

const prisma = new PrismaClient();

async function checkRecurringPayments() {
  try {
    console.log('🔍 Checking production database for recurring payment data...\n');
    
    // 1. Check database type and connection
    console.log('📊 1. Checking database connection:');
    try {
      const dbInfo = await prisma.$queryRaw`SELECT version() as version;`;
      console.log('✅ Database version:', dbInfo[0]?.version || 'Unknown');
    } catch (error) {
      console.log('❌ PostgreSQL version check failed, trying SQLite check...');
      try {
        const sqliteInfo = await prisma.$queryRaw`SELECT sqlite_version() as version;`;
        console.log('✅ SQLite version:', sqliteInfo[0]?.version);
        console.log('⚠️  WARNING: Connected to SQLite instead of PostgreSQL production database!');
      } catch (sqliteError) {
        console.log('❌ Database type unknown:', error.message);
      }
    }
    
    console.log('\n📊 2. Checking subscriptions with recurring payment data:');
    try {
      const subscriptions = await prisma.$queryRaw`
        SELECT 
          id, 
          "userId", 
          plan, 
          "isRecurring", 
          "recurringToken", 
          "recurringMode",
          "nextPaymentDate", 
          "lastPaymentDate",
          "failedPaymentAttempts",
          "maxFailedAttempts",
          "wayforpayOrderReference",
          status,
          "updatedAt"
        FROM "colibrrri_subscriptions" 
        WHERE plan != 'FREE'
        ORDER BY "updatedAt" DESC
        LIMIT 10;
      `;
      
      if (subscriptions.length > 0) {
        console.log('✅ Found subscriptions:');
        subscriptions.forEach((sub, index) => {
          console.log(`\n--- Subscription ${index + 1} ---`);
          console.log(`ID: ${sub.id}`);
          console.log(`User ID: ${sub.userId}`);
          console.log(`Plan: ${sub.plan}`);
          console.log(`Status: ${sub.status}`);
          console.log(`Is Recurring: ${sub.isRecurring}`);
          console.log(`Recurring Token: ${sub.recurringToken || 'None'}`);
          console.log(`Recurring Mode: ${sub.recurringMode || 'None'}`);
          console.log(`Next Payment: ${sub.nextPaymentDate || 'None'}`);
          console.log(`Last Payment: ${sub.lastPaymentDate || 'None'}`);
          console.log(`Failed Attempts: ${sub.failedPaymentAttempts || 0}`);
          console.log(`WayForPay Order Ref: ${sub.wayforpayOrderReference || 'None'}`);
          console.log(`Updated: ${sub.updatedAt}`);
        });
      } else {
        console.log('❌ No paid subscriptions found');
      }
    } catch (error) {
      console.log('❌ Error checking subscriptions:', error.message);
    }
    
    console.log('\n📊 3. Checking recent payments:');
    try {
      const payments = await prisma.$queryRaw`
        SELECT 
          id, 
          "userId", 
          amount, 
          currency,
          status, 
          "wayforpayOrderReference", 
          description,
          "createdAt"
        FROM "colibrrri_payments"
        ORDER BY "createdAt" DESC
        LIMIT 5;
      `;
      
      if (payments.length > 0) {
        console.log('✅ Found recent payments:');
        payments.forEach((payment, index) => {
          console.log(`\n--- Payment ${index + 1} ---`);
          console.log(`ID: ${payment.id}`);
          console.log(`User ID: ${payment.userId}`);
          console.log(`Amount: ${payment.amount} ${payment.currency}`);
          console.log(`Status: ${payment.status}`);
          console.log(`WayForPay Ref: ${payment.wayforpayOrderReference || 'None'}`);
          console.log(`Description: ${payment.description || 'None'}`);
          console.log(`Created: ${payment.createdAt}`);
        });
      } else {
        console.log('❌ No payments found');
      }
    } catch (error) {
      console.log('❌ Error checking payments:', error.message);
    }
    
    console.log('\n📊 4. Summary statistics:');
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN plan != 'FREE' THEN 1 END) as paid_subscriptions,
          COUNT(CASE WHEN "isRecurring" = true THEN 1 END) as recurring_subscriptions,
          COUNT(CASE WHEN "recurringToken" IS NOT NULL THEN 1 END) as subscriptions_with_token
        FROM "colibrrri_subscriptions";
      `;
      
      console.log('✅ Database statistics:');
      console.table(stats);
    } catch (error) {
      console.log('❌ Error getting statistics:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 Starting recurring payment investigation...');
console.log(`📋 Database URL: ${process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌'}`);
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('postgresql://')) {
    console.log('📋 Database Type: PostgreSQL ✅');
  } else if (dbUrl.startsWith('file:')) {
    console.log('📋 Database Type: SQLite (Local) ⚠️');
  } else {
    console.log(`📋 Database Type: Unknown - ${dbUrl.substring(0, 20)}...`);
  }
} else {
  console.log('❌ No DATABASE_URL found in environment');
}
console.log('');

checkRecurringPayments();