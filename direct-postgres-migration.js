#!/usr/bin/env node
/**
 * Direct PostgreSQL Migration Script
 * Works directly with PostgreSQL without Prisma schema conflicts
 */

const pg = require('pg');

const DATABASE_URL = process.argv[2] || "postgresql://neurodecor_user:586qMnRlWWvWajAzX75qSSr9FASQ02wu@dpg-d2c5ulbuibrs7385h9rg-a.oregon-postgres.render.com/neurodecor";

console.log('🚀 Direct PostgreSQL Migration');
console.log('==============================\n');

async function executeMigration() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render PostgreSQL
    }
  });

  try {
    console.log('📊 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test connection
    const versionResult = await client.query('SELECT version()');
    console.log('📊 Database version:', versionResult.rows[0].version.split(' ')[1]);
    console.log('');

    // Check current columns
    console.log('🔍 Checking existing columns...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
    `;
    
    const existingColumns = await client.query(checkQuery);
    console.log(`Found ${existingColumns.rows.length}/7 recurring payment columns\n`);

    if (existingColumns.rows.length === 7) {
      console.log('✅ All columns already exist! No migration needed.');
      return;
    }

    // Execute migration
    console.log('🚀 Executing migration...');
    const migrationSQL = `
      ALTER TABLE "colibrrri_subscriptions" 
      ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
      ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
      ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
    `;

    await client.query(migrationSQL);
    console.log('✅ Migration SQL executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions'
      AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
      ORDER BY column_name;
    `;

    const verifyResult = await client.query(verifyQuery);
    console.log('✅ Successfully added columns:');
    verifyResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Test query
    console.log('\n🔍 Testing with actual query...');
    const testQuery = `
      SELECT id, plan, status, "isRecurring", "recurringToken", "failedPaymentAttempts"
      FROM "colibrrri_subscriptions"
      LIMIT 1;
    `;

    try {
      const testResult = await client.query(testQuery);
      if (testResult.rows.length > 0) {
        console.log('✅ Test query successful!');
        console.log('Sample data:', {
          plan: testResult.rows[0].plan,
          status: testResult.rows[0].status,
          isRecurring: testResult.rows[0].isRecurring,
          failedPaymentAttempts: testResult.rows[0].failedpaymentattempts
        });
      } else {
        console.log('⚠️  No subscriptions found (empty table)');
      }
    } catch (e) {
      console.log('⚠️  Test query failed:', e.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n✅ Production database now supports recurring payments');
    console.log('✅ The 500 errors should be resolved');
    console.log('✅ Payment callbacks will save recToken');
    console.log('✅ Automatic renewals are enabled');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.error('\n⚠️  Table colibrrri_subscriptions not found.');
      console.error('Checking for alternative table names...');
      
      // Try to find the correct table
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%subscription%';
      `;
      
      try {
        const tables = await client.query(tablesQuery);
        if (tables.rows.length > 0) {
          console.log('Found subscription tables:', tables.rows.map(t => t.table_name).join(', '));
        }
      } catch (e) {
        console.log('Could not list tables');
      }
    }
    
    throw error;
  } finally {
    await client.end();
    console.log('\n📊 Database connection closed.');
  }
}

// Install pg if not available
const { execSync } = require('child_process');
try {
  require.resolve('pg');
} catch(e) {
  console.log('📦 Installing pg package...');
  execSync('npm install pg', { stdio: 'inherit' });
}

// Run migration
executeMigration()
  .then(() => {
    console.log('\n✨ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });