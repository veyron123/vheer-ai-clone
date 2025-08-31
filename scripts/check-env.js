#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...\n');

// Required environment variables for production
const requiredEnvVars = {
  server: [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'NODE_ENV',
    'PORT',
    // AI Service APIs
    'FLUX_API_KEY',
    'GPT_IMAGE_API_KEY',
    'GEMINI_API_KEY',
    'QWEN_API_KEY',
    'IMGBB_API_KEY',
    // Payment
    'WAYFORPAY_MERCHANT_ACCOUNT',
    'WAYFORPAY_SECRET_KEY',
    // OAuth (optional but recommended)
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET'
  ],
  client: [
    'VITE_API_URL',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_FACEBOOK_APP_ID'
  ]
};

// Check server .env
const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
const serverEnvExamplePath = path.join(__dirname, '..', 'server', '.env.example');

console.log('📁 Server Environment Variables:');
console.log('================================');

if (fs.existsSync(serverEnvPath)) {
  const envContent = fs.readFileSync(serverEnvPath, 'utf8');
  const envVars = envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0]);

  requiredEnvVars.server.forEach(varName => {
    if (envVars.includes(varName)) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`❌ ${varName} - Missing!`);
    }
  });
} else {
  console.log('⚠️  No server/.env file found!');
  console.log('   Copy server/.env.example to server/.env and fill in values');
}

// Check client .env
const clientEnvPath = path.join(__dirname, '..', 'client', '.env');
const clientEnvExamplePath = path.join(__dirname, '..', 'client', '.env.example');

console.log('\n📁 Client Environment Variables:');
console.log('================================');

if (fs.existsSync(clientEnvPath)) {
  const envContent = fs.readFileSync(clientEnvPath, 'utf8');
  const envVars = envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0]);

  requiredEnvVars.client.forEach(varName => {
    if (envVars.includes(varName)) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`❌ ${varName} - Missing!`);
    }
  });
} else {
  console.log('⚠️  No client/.env file found!');
  console.log('   Copy client/.env.example to client/.env and fill in values');
}

// Check for .env.example files
console.log('\n📋 Example Files:');
console.log('================================');

if (!fs.existsSync(serverEnvExamplePath)) {
  console.log('⚠️  Creating server/.env.example...');
  const exampleContent = requiredEnvVars.server
    .map(v => `${v}=`)
    .join('\n');
  fs.writeFileSync(serverEnvExamplePath, exampleContent);
  console.log('✅ server/.env.example created');
} else {
  console.log('✅ server/.env.example exists');
}

if (!fs.existsSync(clientEnvExamplePath)) {
  console.log('⚠️  Creating client/.env.example...');
  const exampleContent = requiredEnvVars.client
    .map(v => `${v}=`)
    .join('\n');
  fs.writeFileSync(clientEnvExamplePath, exampleContent);
  console.log('✅ client/.env.example created');
} else {
  console.log('✅ client/.env.example exists');
}

// Check render.yaml
console.log('\n🚀 Render Configuration:');
console.log('================================');

const renderYamlPath = path.join(__dirname, '..', 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  console.log('✅ render.yaml found');
  const renderContent = fs.readFileSync(renderYamlPath, 'utf8');
  
  if (renderContent.includes('autoDeploy: true')) {
    console.log('✅ Auto-deploy is enabled');
  } else {
    console.log('⚠️  Auto-deploy is not enabled');
  }
  
  if (renderContent.includes('healthCheckPath:')) {
    console.log('✅ Health check endpoint configured');
  } else {
    console.log('⚠️  No health check endpoint configured');
  }
} else {
  console.log('❌ render.yaml not found!');
}

// Check GitHub Actions
console.log('\n🔧 GitHub Actions:');
console.log('================================');

const workflowsPath = path.join(__dirname, '..', '.github', 'workflows');
if (fs.existsSync(workflowsPath)) {
  const workflows = fs.readdirSync(workflowsPath);
  workflows.forEach(file => {
    console.log(`✅ ${file}`);
  });
} else {
  console.log('❌ No GitHub Actions workflows found');
}

console.log('\n✨ Environment check complete!');