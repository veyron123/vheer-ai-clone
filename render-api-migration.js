#!/usr/bin/env node
/**
 * Render API Migration Script
 * Executes database migration using Render API
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🚀 Render API Database Migration Tool');
console.log('=====================================\n');

// Check for Render API key
const RENDER_API_KEY = process.env.RENDER_API_KEY || process.argv[2];

if (!RENDER_API_KEY) {
  console.log('❌ RENDER_API_KEY not found!\n');
  console.log('📋 How to get your Render API Key:\n');
  console.log('1. Go to https://dashboard.render.com/account/settings');
  console.log('2. Click "API Keys" in the left sidebar');
  console.log('3. Click "Create API Key"');
  console.log('4. Copy the key and run:\n');
  console.log('   node render-api-migration.js YOUR_API_KEY\n');
  console.log('Or set environment variable:');
  console.log('   set RENDER_API_KEY=YOUR_API_KEY');
  console.log('   node render-api-migration.js\n');
  process.exit(1);
}

// Render API configuration
const renderApi = {
  hostname: 'api.render.com',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Function to make API request
function renderApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: renderApi.hostname,
      path: path,
      method: method,
      headers: renderApi.headers
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function executeMigration() {
  try {
    // Step 1: List all services to find database
    console.log('📋 Step 1: Finding PostgreSQL database...');
    const services = await renderApiRequest('GET', '/v1/services?limit=100');
    
    // Find PostgreSQL database
    const databases = services.filter(s => 
      s.type === 'postgres' || 
      s.name?.toLowerCase().includes('db') ||
      s.name?.toLowerCase().includes('database')
    );
    
    if (databases.length === 0) {
      console.log('❌ No PostgreSQL databases found!');
      console.log('Looking for all services...');
      console.log('Services found:', services.map(s => `${s.name} (${s.type})`).join(', '));
      throw new Error('No database service found');
    }
    
    console.log(`✅ Found ${databases.length} database(s):`);
    databases.forEach(db => {
      console.log(`   - ${db.name} (${db.id})`);
    });
    
    // Use first database or vheer-db if exists
    const targetDb = databases.find(db => 
      db.name === 'vheer-db' || 
      db.name === 'colibrrri-db' ||
      db.name === 'colibrrri-fullstack'
    ) || databases[0];
    
    console.log(`\n📊 Using database: ${targetDb.name}`);
    
    // Step 2: Get database details
    console.log('\n📋 Step 2: Getting database connection details...');
    const dbDetails = await renderApiRequest('GET', `/v1/services/${targetDb.id}`);
    
    // Step 3: Get environment variables for the database
    console.log('\n📋 Step 3: Getting database URL...');
    const envVars = await renderApiRequest('GET', `/v1/services/${targetDb.id}/env-vars`);
    
    // Find DATABASE_URL
    const dbUrlVar = envVars.find(env => 
      env.key === 'DATABASE_URL' || 
      env.key === 'POSTGRES_URL' ||
      env.key.includes('CONNECTION_STRING')
    );
    
    if (!dbUrlVar) {
      console.log('⚠️  DATABASE_URL not found in environment variables');
      console.log('Available variables:', envVars.map(e => e.key).join(', '));
      
      // Try to construct URL from database details
      if (dbDetails.connectionInfo) {
        const { host, port, database, username } = dbDetails.connectionInfo;
        console.log('\n📋 Database connection info:');
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Database: ${database}`);
        console.log(`   Username: ${username}`);
        console.log('\n⚠️  Password not available via API for security');
        console.log('Please use Render Dashboard to get the full connection string');
      }
      
      throw new Error('Cannot get DATABASE_URL via API');
    }
    
    const DATABASE_URL = dbUrlVar.value;
    console.log('✅ Found DATABASE_URL');
    
    // Step 4: Execute migration using the URL
    console.log('\n📋 Step 4: Executing migration...');
    console.log('Running migration script with obtained DATABASE_URL...\n');
    
    // Run the migration script with the DATABASE_URL
    const migrationCommand = `node execute-migration-now.js "${DATABASE_URL}"`;
    
    try {
      const output = execSync(migrationCommand, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      console.log('✅ Migration executed successfully!');
    } catch (error) {
      console.error('❌ Migration execution failed:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n⚠️  Authentication failed. Check your API key.');
    } else if (error.message.includes('DATABASE_URL')) {
      console.log('\n📋 Alternative: Manual migration via Render Dashboard');
      console.log('1. Go to https://dashboard.render.com');
      console.log('2. Open your database service');
      console.log('3. Go to "Shell" or "Connect" tab');
      console.log('4. Execute the SQL from quick-migration.sql');
    }
    
    process.exit(1);
  }
}

// Check if we can use Render CLI instead
console.log('📋 Checking for Render CLI...');
try {
  execSync('render --version', { stdio: 'ignore' });
  console.log('✅ Render CLI is available');
  console.log('\n📋 Alternative: You can use Render CLI directly:');
  console.log('   render login');
  console.log('   render db:connect vheer-db');
  console.log('   Then paste the SQL from quick-migration.sql\n');
} catch (e) {
  console.log('⚠️  Render CLI not found, using API method\n');
}

// Execute migration
executeMigration()
  .then(() => {
    console.log('\n✨ Process completed!');
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });