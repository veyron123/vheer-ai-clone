# 🚨 CRITICAL PRODUCTION FIX - Recurring Payment Columns Missing

## Problem
Your production database is missing the recurring payment columns that exist in your Prisma schema, causing 500 errors.

## ✅ SOLUTION: Multiple Options to Fix Production

### **Option 1: Render Dashboard (FASTEST - RECOMMENDED)**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your PostgreSQL database service** (colibrrri-fullstack)
3. **Click "Connect" or access the database console**
4. **Execute this SQL** in the database console:

```sql
ALTER TABLE "colibrrri_subscriptions" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
```

5. **Verify** with this query:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'colibrrri_subscriptions' 
AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate');
```

### **Option 2: Node.js Migration Script**

If you have your production DATABASE_URL:

```bash
# Set production database URL
export DATABASE_URL="your-production-postgres-url"

# Run migration
cd server
node migrate-production-simple.js
```

### **Option 3: Via Production Environment**

1. **Create `.env.production`** with your production DATABASE_URL
2. **Run the migration script:**
```bash
node check-recurring-payments.js
```

## 🔍 Verification Steps

After running the migration, verify it worked:

1. **Check the production site** - should no longer show 500 errors
2. **Run the verification script:**
```bash
node check-recurring-payments.js
```

## 📋 What These Columns Do

- **isRecurring**: Whether the subscription auto-renews
- **recurringToken**: WayForPay token for automatic payments  
- **recurringMode**: MONTHLY or YEARLY billing cycle
- **nextPaymentDate**: When the next auto-payment occurs
- **lastPaymentDate**: Last successful payment timestamp
- **failedPaymentAttempts**: Count of failed auto-payments
- **maxFailedAttempts**: Max fails before cancellation (default: 3)

## ⚠️ Important Notes

- **IF NOT EXISTS** prevents errors if columns already exist
- **Default values** ensure existing subscriptions work
- **No data loss** - existing subscriptions remain unchanged
- **Backward compatible** - old code continues working

## 🚀 After Migration

Your production site will:
- ✅ No longer throw 500 errors
- ✅ Support recurring payments
- ✅ Handle subscription management properly
- ✅ Work with existing payment flows

## 🆘 If Migration Fails

1. Check the database connection string is correct
2. Ensure you have proper permissions on the database
3. Try the SQL directly in Render's database console
4. Contact Render support if database access issues persist

The migration is **safe** and **reversible** - it only adds columns, doesn't modify existing data.