#!/usr/bin/env node
/**
 * Automatic Migration Script
 * Tries multiple methods to execute the database migration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Automatic Database Migration Tool');
console.log('====================================\n');

// Migration SQL
const MIGRATION_SQL = `
ALTER TABLE "colibrrri_subscriptions" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
`.trim();

// Function to try different migration methods
async function tryMigrationMethods() {
  console.log('🔍 Attempting automatic migration...\n');
  
  // Method 1: Try using Prisma migrate
  console.log('📋 Method 1: Trying Prisma migrate...');
  try {
    // Check if we're in server directory
    const serverPath = fs.existsSync('server/prisma') ? 'server' : '.';
    process.chdir(serverPath);
    
    // Create a migration file
    const migrationDir = 'prisma/migrations/manual_recurring_payment_columns';
    fs.mkdirSync(migrationDir, { recursive: true });
    fs.writeFileSync(
      path.join(migrationDir, 'migration.sql'),
      MIGRATION_SQL
    );
    
    console.log('   Running Prisma migrate...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migration successful via Prisma!');
    return true;
  } catch (error) {
    console.log('⚠️  Prisma migrate failed:', error.message.split('\n')[0]);
  }
  
  // Method 2: Try using environment DATABASE_URL
  console.log('\n📋 Method 2: Checking for DATABASE_URL in environment...');
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
    try {
      console.log('   Found DATABASE_URL, running migration script...');
      execSync(`node execute-migration-now.js "${process.env.DATABASE_URL}"`, { stdio: 'inherit' });
      console.log('✅ Migration successful via DATABASE_URL!');
      return true;
    } catch (error) {
      console.log('⚠️  DATABASE_URL migration failed:', error.message.split('\n')[0]);
    }
  } else {
    console.log('⚠️  No valid DATABASE_URL in environment');
  }
  
  // Method 3: Interactive mode - ask user for DATABASE_URL
  console.log('\n📋 Method 3: Interactive mode...');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n⚠️  Automatic methods failed. Manual input required.\n');
    console.log('📋 To get your DATABASE_URL:');
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Click on your PostgreSQL database (vheer-db or colibrrri-db)');
    console.log('3. Go to "Connect" tab');
    console.log('4. Copy the "External Database URL"\n');
    
    rl.question('Paste your DATABASE_URL here (or press Enter to skip): ', async (url) => {
      rl.close();
      
      if (url && url.startsWith('postgresql://')) {
        try {
          console.log('\n   Running migration with provided URL...');
          execSync(`node execute-migration-now.js "${url}"`, { stdio: 'inherit' });
          console.log('✅ Migration successful!');
          resolve(true);
        } catch (error) {
          console.log('❌ Migration failed:', error.message);
          resolve(false);
        }
      } else {
        console.log('\n⚠️  Skipped manual migration');
        resolve(false);
      }
    });
  });
}

// Function to show manual instructions
function showManualInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('\nSince automatic migration failed, please do it manually:\n');
  console.log('Option 1: Render Dashboard SQL Console');
  console.log('----------------------------------------');
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Open your PostgreSQL database');
  console.log('3. Click "Shell" or "PSQL" button');
  console.log('4. Copy and paste this SQL:\n');
  console.log(MIGRATION_SQL);
  console.log('\nOption 2: Using DATABASE_URL');
  console.log('----------------------------------------');
  console.log('1. Get your DATABASE_URL from Render Dashboard');
  console.log('2. Run: node execute-migration-now.js "YOUR_DATABASE_URL"');
  console.log('\nOption 3: Using psql client');
  console.log('----------------------------------------');
  console.log('1. Install PostgreSQL client if needed');
  console.log('2. Get connection string from Render');
  console.log('3. Run: psql "YOUR_DATABASE_URL" -c "SQL_HERE"');
  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  try {
    // Check if required files exist
    if (!fs.existsSync('execute-migration-now.js')) {
      console.log('⚠️  execute-migration-now.js not found');
      console.log('   Make sure you are in the project root directory\n');
    }
    
    // Try automatic migration
    const success = await tryMigrationMethods();
    
    if (success) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('\n✅ Your production database now has recurring payment columns');
      console.log('✅ The 500 errors should be resolved');
      console.log('✅ Payments will work correctly');
      console.log('✅ Recurring tokens will be saved');
    } else {
      showManualInstructions();
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    showManualInstructions();
    process.exit(1);
  }
}

// Run the migration
main();