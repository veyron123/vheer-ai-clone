# 🚀 Production Database Migration Instructions

## ⚠️ CRITICAL: Add Recurring Payment Columns to Production Database

### Issue
The production server is experiencing 500 errors because the database is missing recurring payment columns that were added to the schema but not migrated to production.

### Required Columns to Add
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

## 📋 Migration Options

### Option 1: Using Render CLI (Recommended)

1. **Install Render CLI** (if not already installed):
   ```bash
   # On macOS/Linux:
   curl -fsSL https://raw.githubusercontent.com/render-oss/cli/refs/heads/main/bin/install.sh | sh
   
   # Or using Homebrew:
   brew install render
   ```

2. **Authenticate with Render**:
   ```bash
   render auth login
   ```

3. **Get Database Connection String**:
   ```bash
   # List services to find your database
   render services list
   
   # Get database connection details (look for vheer-db)
   render databases list
   
   # Get the external connection string
   render database shell vheer-db --print-connection-string
   ```

4. **Run Migration Script**:
   ```bash
   # Navigate to project directory
   cd path/to/Colibrrri-clone
   
   # Run migration with production DATABASE_URL
   node migrate-prod-direct.js "postgresql://user:pass@host/db"
   ```

### Option 2: Using Render Dashboard (Web Interface)

1. **Get Database URL**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Find your database service (likely named `vheer-db` or `colibrrri-db`)
   - Click on the database service
   - Go to "Connect" tab
   - Copy the "External Database URL"

2. **Run Migration**:
   ```bash
   cd path/to/Colibrrri-clone
   node migrate-prod-direct.js "YOUR_COPIED_DATABASE_URL"
   ```

### Option 3: Using Render Shell (Direct Database Access)

1. **Access Database Shell**:
   ```bash
   render database shell vheer-db
   ```

2. **Run SQL Directly**:
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

3. **Verify Columns**:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'colibrrri_subscriptions'
   AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts');
   ```

## 🔍 Verification Steps

After running the migration, verify it worked:

1. **Check Column Existence**:
   ```sql
   \d colibrrri_subscriptions
   ```

2. **Test Query**:
   ```sql
   SELECT id, plan, status, "isRecurring", "recurringToken", "failedPaymentAttempts" 
   FROM "colibrrri_subscriptions" 
   LIMIT 1;
   ```

## 🎯 Expected Results

After successful migration, you should see:
- ✅ 7 new columns added to `colibrrri_subscriptions` table
- ✅ Default values applied (`isRecurring = false`, `failedPaymentAttempts = 0`, `maxFailedAttempts = 3`)
- ✅ Production server 500 errors resolved
- ✅ Recurring payment functionality enabled

## ⚡ Quick Command Reference

```bash
# If you already have the DATABASE_URL:
node migrate-prod-direct.js "postgresql://user:pass@host:port/db"

# The script will:
# 1. Connect to production database
# 2. Add all 7 recurring payment columns
# 3. Verify columns were created
# 4. Test a query to ensure everything works
# 5. Report success/failure
```

## 🚨 Important Notes

- The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times
- All new columns have appropriate defaults and won't break existing data
- The script includes comprehensive error handling and verification
- This will fix the production 500 errors related to missing recurring payment columns

## 📞 Support

If you encounter any issues:
1. Check database permissions (need ALTER TABLE privileges)
2. Verify DATABASE_URL is correct and accessible
3. Ensure the `colibrrri_subscriptions` table exists
4. Check Render service logs for connection issues