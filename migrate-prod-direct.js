#!/usr/bin/env node
// Direct production migration script - requires DATABASE_URL as argument

const { PrismaClient } = require('@prisma/client');

// Get DATABASE_URL from command line argument
const DATABASE_URL = process.argv[2];

if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ ERROR: PostgreSQL DATABASE_URL required as argument');
  console.error('Usage: node migrate-prod-direct.js "postgresql://user:pass@host/db"');
  console.error('');
  console.error('To get the DATABASE_URL from Render:');
  console.error('1. Go to https://dashboard.render.com');
  console.error('2. Click on your database (vheer-db or colibrrri-db)');
  console.error('3. Go to "Connect" tab');
  console.error('4. Copy the "External Database URL"');
  console.error('5. Run: node migrate-prod-direct.js "YOUR_DATABASE_URL"');
  process.exit(1);
}

console.log('🚀 Connecting to production database...');
console.log('');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function runMigration() {
  try {
    // Test connection
    console.log('📊 Testing database connection...');
    const dbVersion = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Connected to:', dbVersion[0].version);
    console.log('');
    
    // Run migration as a single transaction
    console.log('📋 Running migration to add recurring payment columns...');
    console.log('');
    
    const result = await prisma.$executeRaw`
      ALTER TABLE "colibrrri_subscriptions" 
      ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
      ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
      ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
    `;
    
    console.log('✅ Migration executed successfully!');
    console.log('');
    
    // Verify columns were added
    console.log('📋 Verifying new columns...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
      ORDER BY column_name;
    `;
    
    console.log('✅ Found columns:');
    console.table(columns);
    console.log('');
    
    // Test query
    console.log('📋 Testing query with new columns...');
    const testQuery = await prisma.subscription.findFirst({
      select: {
        id: true,
        plan: true,
        status: true,
        isRecurring: true,
        recurringToken: true,
        recurringMode: true,
        failedPaymentAttempts: true,
        maxFailedAttempts: true
      }
    });
    
    if (testQuery) {
      console.log('✅ Test query successful!');
      console.log('Sample subscription:', JSON.stringify(testQuery, null, 2));
    } else {
      console.log('⚠️  No subscriptions found (database may be empty)');
    }
    
    console.log('');
    console.log('🎉 SUCCESS! Database migration completed!');
    console.log('✅ Recurring payment columns have been added');
    console.log('✅ The production server can now handle recurring payments');
    console.log('✅ Payment callbacks will save recToken and schedule renewals');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.error('');
      console.error('⚠️  Permission denied. Make sure you have ALTER TABLE privileges.');
    } else if (error.message.includes('does not exist')) {
      console.error('');
      console.error('⚠️  Table or database not found. Check your DATABASE_URL.');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('');
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });