// Simple test without authentication
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testEndpoint(name, endpoint, method = 'POST') {
  console.log(`\n📝 Testing ${name}...`);
  
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data: method === 'POST' ? { test: true } : undefined
    });
    
    console.log(`✅ ${name} - Endpoint exists (${response.status})`);
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ ${name} - Endpoint exists (requires auth)`);
      return true;
    } else if (error.response?.status === 400) {
      console.log(`✅ ${name} - Endpoint exists (bad request)`);
      return true;
    } else if (error.response?.status === 404) {
      console.log(`❌ ${name} - Endpoint NOT found (404)`);
      return false;
    } else {
      console.log(`⚠️ ${name} - Error: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Testing AI Model Endpoints');
  console.log('================================');
  
  const results = [];
  
  // Test all endpoints
  results.push(await testEndpoint('Flux Generate', '/flux/generate'));
  results.push(await testEndpoint('Nano-Banana Image-to-Image', '/nano-banana/image-to-image'));
  results.push(await testEndpoint('Nano-Banana Generate', '/nano-banana/generate'));
  results.push(await testEndpoint('GPT Image Generate', '/gptimage/generate'));
  results.push(await testEndpoint('GPT Image Image-to-Image', '/gptimage/image-to-image'));
  results.push(await testEndpoint('Qwen Generate', '/qwen/generate'));
  results.push(await testEndpoint('Qwen Edit', '/qwen/edit'));
  
  console.log('\n================================');
  console.log('📊 Endpoint Test Results:');
  console.log(`✅ Available: ${results.filter(r => r).length}`);
  console.log(`❌ Missing: ${results.filter(r => !r).length}`);
  console.log('================================\n');
}

// Run tests
runTests().catch(console.error);