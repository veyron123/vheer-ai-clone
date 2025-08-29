#!/usr/bin/env node

// Production database migration script
// This script adds the missing recurring payment columns to production

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function migrateProduction() {
  console.log('🚀 Starting production database migration...');
  
  try {
    // First, let's check current table structure
    console.log('📋 Checking current colibrrri_subscriptions table structure...');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Current columns:', tableInfo);
    
    // Check which columns are missing
    const existingColumns = tableInfo.map(col => col.column_name);
    const requiredColumns = [
      'isRecurring', 'recurringToken', 'recurringMode', 
      'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All recurring payment columns already exist!');
      return;
    }
    
    console.log('❌ Missing columns:', missingColumns);
    console.log('🔧 Adding missing columns...');
    
    // Add missing columns one by one with error handling
    const migrations = [
      {
        column: 'isRecurring',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false;`
      },
      {
        column: 'recurringToken',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "recurringToken" TEXT;`
      },
      {
        column: 'recurringMode', 
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "recurringMode" TEXT;`
      },
      {
        column: 'nextPaymentDate',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3);`
      },
      {
        column: 'lastPaymentDate',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3);`
      },
      {
        column: 'failedPaymentAttempts',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0;`
      },
      {
        column: 'maxFailedAttempts',
        sql: `ALTER TABLE "colibrrri_subscriptions" ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;`
      }
    ];
    
    for (const migration of migrations) {
      try {
        console.log(`  ➕ Adding column: ${migration.column}`);
        await prisma.$executeRawUnsafe(migration.sql);
        console.log(`  ✅ Successfully added: ${migration.column}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  Column ${migration.column} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error adding ${migration.column}:`, error.message);
          throw error;
        }
      }
    }
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const updatedTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'colibrrri_subscriptions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('✅ Updated table structure:', updatedTableInfo);
    
    // Test a simple query to make sure everything works
    console.log('🧪 Testing query...');
    const testQuery = await prisma.subscription.findFirst({
      select: {
        id: true,
        isRecurring: true,
        recurringToken: true,
        recurringMode: true,
        nextPaymentDate: true,
        lastPaymentDate: true,
        failedPaymentAttempts: true,
        maxFailedAttempts: true
      }
    });
    
    console.log('✅ Test query successful!', testQuery ? 'Found subscription data' : 'No subscriptions yet');
    
    console.log('🎉 Production migration completed successfully!');
    console.log('🚀 Your production site should now work without 500 errors.');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProduction()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateProduction };