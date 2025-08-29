#!/usr/bin/env node
/**
 * RENDER MCP MIGRATION SCRIPT
 * 
 * This script attempts to use Render MCP tools to execute the database migration.
 * If MCP tools are not available, it provides alternative methods.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🚀 Render MCP Migration Script');
console.log('================================\n');

// Migration SQL
const MIGRATION_SQL = `
  ALTER TABLE "colibrrri_subscriptions" 
  ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
  ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
  ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3
`;

console.log('📋 Migration SQL:');
console.log(MIGRATION_SQL.trim());
console.log('\n' + '='.repeat(50) + '\n');

async function tryRenderMCPMigration() {
  console.log('Method 1: Attempting to use Render MCP tools...\n');
  
  try {
    // Check if claude CLI with render MCP is available
    const mcpStatus = execSync('claude mcp list', { encoding: 'utf8' });
    console.log('✅ Claude MCP available:');
    console.log(mcpStatus);
    
    if (mcpStatus.includes('render')) {
      console.log('✅ Render MCP detected!');
      console.log('\n🔍 Attempting to list Render services...');
      
      try {
        // Try to use Render MCP to get services
        console.log('Render MCP is connected but we need to manually check for database services.');
        console.log('\nPlease manually check your Render dashboard for:');
        console.log('- vheer-db');
        console.log('- colibrrri-db'); 
        console.log('- colibrrri-fullstack database');
        
        return false; // Need manual intervention
      } catch (error) {
        console.log('❌ Could not list Render services via MCP');
        return false;
      }
    } else {
      console.log('⚠️  Render MCP not found in connected services');
      return false;
    }
  } catch (error) {
    console.log('❌ Claude MCP not available or Render MCP not connected');
    return false;
  }
}

async function tryDirectDatabaseConnection() {
  console.log('\nMethod 2: Checking for DATABASE_URL in environment...\n');
  
  // Check if DATABASE_URL is set as environment variable
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    console.log('✅ Found DATABASE_URL in environment!');
    console.log('🔍 Testing connection...');
    
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: { url: databaseUrl }
        }
      });
      
      // Test connection
      await prisma.$connect();
      const version = await prisma.$queryRaw`SELECT version()`;
      console.log('✅ Connected to:', version[0].version.substring(0, 20) + '...');
      
      // Execute migration
      console.log('\n🚀 Executing migration...');
      const result = await prisma.$executeRaw`${MIGRATION_SQL}`;
      
      console.log('✅ Migration executed successfully!');
      
      // Verify
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'colibrrri_subscriptions'
        AND column_name IN ('isRecurring', 'recurringToken', 'recurringMode', 'nextPaymentDate', 'lastPaymentDate', 'failedPaymentAttempts', 'maxFailedAttempts')
        ORDER BY column_name
      `;
      
      console.log('\n✅ Verified columns added:');
      console.table(columns);
      
      await prisma.$disconnect();
      return true;
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  } else {
    console.log('⚠️  No DATABASE_URL found in environment');
    return false;
  }
}

async function provideManualInstructions() {
  console.log('\nMethod 3: Manual Migration Instructions\n');
  console.log('📋 Since automatic methods failed, please follow these steps:\n');
  
  console.log('OPTION A: Using Render Dashboard SQL Console');
  console.log('============================================');
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Find your PostgreSQL database (likely named: vheer-db, colibrrri-db, or colibrrri-fullstack)');
  console.log('3. Click on the database');
  console.log('4. Go to "SQL Console" or "Query" tab');
  console.log('5. Execute this SQL:');
  console.log('\n```sql');
  console.log(MIGRATION_SQL.trim());
  console.log('```\n');
  
  console.log('OPTION B: Using DATABASE_URL');
  console.log('============================');
  console.log('1. In your database dashboard, go to "Connect" tab');
  console.log('2. Copy the "External Database URL"');
  console.log('3. Run this command:');
  console.log('   node execute-migration-now.js "YOUR_DATABASE_URL_HERE"');
  
  console.log('\nOPTION C: Environment Variable Method');
  console.log('=====================================');
  console.log('1. Set the DATABASE_URL environment variable:');
  console.log('   export DATABASE_URL="postgresql://username:password@host:port/database"');
  console.log('2. Run this script again:');
  console.log('   node render-mcp-migration.js');
}

async function main() {
  try {
    console.log('🔍 Trying multiple methods to execute migration...\n');
    
    // Try Render MCP first
    const mcpSuccess = await tryRenderMCPMigration();
    if (mcpSuccess) {
      console.log('\n🎉 Migration completed via Render MCP!');
      return;
    }
    
    // Try direct database connection
    const dbSuccess = await tryDirectDatabaseConnection();
    if (dbSuccess) {
      console.log('\n🎉 Migration completed via direct database connection!');
      return;
    }
    
    // Provide manual instructions
    await provideManualInstructions();
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error('\nThis indicates a critical issue that needs immediate attention.');
    process.exit(1);
  }
}

// Run the migration
main();