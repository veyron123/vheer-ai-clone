#!/usr/bin/env node
/**
 * IMMEDIATE MIGRATION EXECUTION SCRIPT
 * 
 * This script will attempt to execute the database migration using various methods.
 * It will try to find and use production credentials automatically.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🚀 Starting Production Database Migration Process...');
console.log('================================================\n');

// Try to load production environment variables
const envPaths = [
  path.join(__dirname, '.env.production'),
  path.join(__dirname, 'server/.env.production'),
  path.join(__dirname, '.env.production.local'),
  path.join(__dirname, 'server/.env.production.local'),
  path.join(__dirname, '.env')
];

let DATABASE_URL = process.env.DATABASE_URL;

// Try to find DATABASE_URL from various sources
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📋 Checking ${envPath}...`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.DATABASE_URL && envConfig.DATABASE_URL.startsWith('postgresql://')) {
      DATABASE_URL = envConfig.DATABASE_URL;
      console.log('✅ Found DATABASE_URL in', envPath);
      break;
    }
  }
}

// If still no DATABASE_URL, try to get from command line
if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
  console.log('\n⚠️  DATABASE_URL not found in environment files.');
  console.log('\n📋 MANUAL STEPS REQUIRED:\n');
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Click on your PostgreSQL database (vheer-db or colibrrri-db)');
  console.log('3. Go to "Connect" tab');
  console.log('4. Copy the "External Database URL"');
  console.log('5. Run this command:\n');
  console.log('   node execute-migration-now.js "postgresql://YOUR_DATABASE_URL_HERE"\n');
  
  // Check if provided as argument
  if (process.argv[2] && process.argv[2].startsWith('postgresql://')) {
    DATABASE_URL = process.argv[2];
    console.log('✅ Using DATABASE_URL from command line argument');
  } else {
    console.log('\n❌ No valid DATABASE_URL provided. Exiting...');
    process.exit(1);
  }
}

console.log('\n📊 Connecting to production database...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

async function executeMigration() {
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Connected to PostgreSQL:', result[0].version.split(' ')[0]);
    
    // Check if columns already exist
    console.log('\n🔍 Checking existing columns...');
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
    `;
    
    if (existingColumns.length === 7) {
      console.log('✅ All recurring payment columns already exist!');
      console.log('📋 Found columns:', existingColumns.map(c => c.column_name).join(', '));
      console.log('\n🎉 No migration needed - database is already up to date!');
      return;
    }
    
    console.log(`⚠️  Found ${existingColumns.length}/7 columns. Adding missing columns...`);
    
    // Execute migration
    console.log('\n🚀 Executing migration...');
    
    const migrationResult = await prisma.$executeRaw`
      ALTER TABLE "colibrrri_subscriptions" 
      ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
      ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
      ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3
    `;
    
    console.log('✅ Migration SQL executed successfully!');
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
      ORDER BY column_name
    `;
    
    console.log('\n✅ Successfully added columns:');
    console.table(verifyColumns.map(col => ({
      Column: col.column_name,
      Type: col.data_type,
      Default: col.column_default || 'NULL'
    })));
    
    // Test query
    console.log('\n🔍 Testing query with new columns...');
    const testQuery = await prisma.subscription.findFirst({
      select: {
        id: true,
        plan: true,
        status: true,
        isRecurring: true,
        recurringToken: true,
        recurringMode: true,
        nextPaymentDate: true,
        lastPaymentDate: true,
        failedPaymentAttempts: true,
        maxFailedAttempts: true
      }
    });
    
    if (testQuery) {
      console.log('✅ Test query successful! Sample data:');
      console.log({
        plan: testQuery.plan,
        status: testQuery.status,
        isRecurring: testQuery.isRecurring,
        recurringToken: testQuery.recurringToken ? '***hidden***' : null,
        failedAttempts: testQuery.failedPaymentAttempts
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n✅ Production database now supports recurring payments');
    console.log('✅ The 500 errors should be resolved');
    console.log('✅ Payment callbacks will now save recToken');
    console.log('✅ Automatic subscription renewals are enabled');
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED!');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n⚠️  Cannot connect to database. Check your DATABASE_URL.');
    } else if (error.code === '42501') {
      console.error('\n⚠️  Permission denied. User lacks ALTER TABLE privileges.');
    } else if (error.message.includes('SSL')) {
      console.error('\n⚠️  SSL connection issue. The database requires SSL.');
    }
    
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Verify DATABASE_URL is correct');
    console.error('2. Check database user has ALTER TABLE permissions');
    console.error('3. Ensure database is accessible from your network');
    console.error('4. Try using Render Dashboard SQL console instead');
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute migration
executeMigration()
  .then(() => {
    console.log('\n✨ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during migration');
    process.exit(1);
  });