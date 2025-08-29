-- Production Database Migration for Recurring Payments
-- Execute this in Render PostgreSQL database console

-- Add all recurring payment columns in a single statement
ALTER TABLE "colibrrri_subscriptions" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'colibrrri_subscriptions'
AND column_name IN (
  'isRecurring', 
  'recurringToken', 
  'recurringMode', 
  'nextPaymentDate', 
  'lastPaymentDate', 
  'failedPaymentAttempts', 
  'maxFailedAttempts'
)
ORDER BY column_name;

-- Test that queries work with new columns
SELECT 
  id,
  plan,
  status,
  "isRecurring",
  "recurringToken",
  "recurringMode",
  "nextPaymentDate",
  "failedPaymentAttempts",
  "maxFailedAttempts"
FROM "colibrrri_subscriptions"
LIMIT 5;