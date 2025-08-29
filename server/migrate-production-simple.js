// Simple production migration script
// Usage: DATABASE_URL="your-production-url" node migrate-production-simple.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRecurringColumns() {
  console.log('🚀 Adding recurring payment columns...');
  
  try {
    // Add all missing columns in one statement
    await prisma.$executeRaw`
      ALTER TABLE "colibrrri_subscriptions" 
      ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
      ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
      ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
    `;
    
    console.log('✅ Columns added successfully!');
    
    // Test that the columns work
    const result = await prisma.subscription.findFirst({
      select: {
        id: true,
        isRecurring: true,
        failedPaymentAttempts: true,
        maxFailedAttempts: true
      }
    });
    
    console.log('✅ Migration verified! New columns are working.');
    console.log('🎉 Production database is now fixed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addRecurringColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));