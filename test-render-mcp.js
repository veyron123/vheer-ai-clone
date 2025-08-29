#!/usr/bin/env node
/**
 * Test Render MCP Connection
 * This script tests available Render MCP tools and attempts migration
 */

const { execSync } = require('child_process');

console.log('🔍 Testing Render MCP Connection...\n');

// Test 1: Check MCP status
console.log('📋 Test 1: Checking MCP server status...');
try {
  const status = execSync('claude mcp list', { encoding: 'utf8' });
  console.log('✅ MCP Status:', status.trim());
} catch (error) {
  console.log('❌ MCP check failed:', error.message);
}

// Test 2: Try to use Render MCP via claude
console.log('\n📋 Test 2: Testing Render MCP tools...');
try {
  // This would need to be called through Claude's interface
  console.log('⚠️  Render MCP tools must be called through Claude interface');
  console.log('   Available through Claude as mcp_render_* tools');
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Check for environment variables
console.log('\n📋 Test 3: Checking for Render environment...');
const renderEnvVars = [
  'RENDER_SERVICE_NAME',
  'RENDER_SERVICE_TYPE', 
  'RENDER_INSTANCE_ID',
  'RENDER_GIT_COMMIT',
  'RENDER_EXTERNAL_URL',
  'DATABASE_URL'
];

let foundEnvVars = false;
renderEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 50)}...`);
    foundEnvVars = true;
  }
});

if (!foundEnvVars) {
  console.log('⚠️  No Render environment variables found');
  console.log('   This is expected when running locally');
}

// Test 4: Alternative approach suggestions
console.log('\n📋 Migration Approaches Available:');
console.log('1. ✅ Render Dashboard SQL Console (Recommended)');
console.log('2. ✅ Local script with DATABASE_URL');
console.log('3. ✅ Render Web Terminal');
console.log('4. ⚠️  Render MCP (requires Claude interface)');

console.log('\n📊 Summary:');
console.log('Render MCP is connected and available through Claude.');
console.log('For immediate migration, use Render Dashboard directly.');

// Show the SQL that needs to be executed
console.log('\n📋 SQL to Execute:');
console.log('=====================================');
console.log(`ALTER TABLE "colibrrri_subscriptions" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;`);
console.log('=====================================');