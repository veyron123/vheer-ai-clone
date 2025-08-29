// Production migration script for recurring payment columns
// This script connects directly to production database and applies migration

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load production environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env.production') });

// Override with actual production DATABASE_URL if provided as argument
if (process.argv[2]) {
  process.env.DATABASE_URL = process.argv[2];
}

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ ERROR: Valid PostgreSQL DATABASE_URL is required');
  console.error('Usage: node run-production-migration.js "postgresql://..."');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function runMigration() {
  console.log('🚀 Starting production database migration...');
  console.log('📊 Database: PostgreSQL (Production)');
  console.log('');

  try {
    // Step 1: Check current columns
    console.log('📋 Step 1: Checking existing columns...');
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts');
    `;
    
    console.log(`Found ${existingColumns.length} recurring columns already exist`);
    
    // Step 2: Add missing columns
    console.log('\n📋 Step 2: Adding missing recurring payment columns...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false;
      `;
      console.log('✅ Added isRecurring column');
    } catch (error) {
      console.log('⚠️  isRecurring column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "recurringToken" TEXT;
      `;
      console.log('✅ Added recurringToken column');
    } catch (error) {
      console.log('⚠️  recurringToken column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "recurringMode" TEXT;
      `;
      console.log('✅ Added recurringMode column');
    } catch (error) {
      console.log('⚠️  recurringMode column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3);
      `;
      console.log('✅ Added nextPaymentDate column');
    } catch (error) {
      console.log('⚠️  nextPaymentDate column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3);
      `;
      console.log('✅ Added lastPaymentDate column');
    } catch (error) {
      console.log('⚠️  lastPaymentDate column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0;
      `;
      console.log('✅ Added failedPaymentAttempts column');
    } catch (error) {
      console.log('⚠️  failedPaymentAttempts column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "colibrrri_subscriptions" 
        ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
      `;
      console.log('✅ Added maxFailedAttempts column');
    } catch (error) {
      console.log('⚠️  maxFailedAttempts column already exists or error:', error.message);
    }

    // Step 3: Verify migration
    console.log('\n📋 Step 3: Verifying migration...');
    
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
      ORDER BY column_name;
    `;
    
    console.log('\n✅ Migration completed! Columns now in database:');
    console.table(verifyColumns);

    // Step 4: Test with actual query
    console.log('\n📋 Step 4: Testing with actual subscription query...');
    
    const testSubscription = await prisma.subscription.findFirst({
      select: {
        id: true,
        plan: true,
        isRecurring: true,
        recurringToken: true,
        recurringMode: true,
        nextPaymentDate: true,
        lastPaymentDate: true,
        failedPaymentAttempts: true,
        maxFailedAttempts: true
      }
    });
    
    if (testSubscription) {
      console.log('✅ Successfully queried subscription with recurring fields:');
      console.log(JSON.stringify(testSubscription, null, 2));
    } else {
      console.log('⚠️  No subscriptions found to test with');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Production database now supports recurring payments');
    console.log('✅ Payment callbacks will now save recurringToken and related fields');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  });