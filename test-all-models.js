// Test script for all AI models
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxNGRkODlmLTc3NmItNGJjOC05MDRhLWI2YTY0OWU2MjRjOCIsImVtYWlsIjoidW5pdHJhZGVjYXJnb0BnbWFpbC5jb20iLCJpYXQiOjE3MjUxMDk2OTksImV4cCI6MTcyNTcxNDQ5OX0.fz8kOobXOaRJVvR1CtVn-Hir7OGUxO6jW7eGQeCQ_RE';

const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function testModel(name, endpoint, data) {
  console.log(`\n📝 Testing ${name}...`);
  
  try {
    const response = await axios.post(`${API_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Image URL: ${response.data.image}`);
      console.log(`   Credits Used: ${response.data.credits?.used || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ ${name} - FAILED (success: false)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Model Tests');
  console.log('================================');
  
  const results = [];
  
  // Test Flux (Working)
  results.push(await testModel('Flux Pro', '/flux/generate', {
    prompt: 'A beautiful sunset',
    input_image: testImageBase64,
    model: 'flux-pro',
    aspectRatio: '1:1'
  }));
  
  // Test Nano-Banana image-to-image
  results.push(await testModel('Nano-Banana (Image-to-Image)', '/nano-banana/image-to-image', {
    prompt: 'Transform to abstract art',
    input_image: testImageBase64,
    aspectRatio: '1:1'
  }));
  
  // Test Nano-Banana text-to-image
  results.push(await testModel('Nano-Banana (Text-to-Image)', '/nano-banana/generate', {
    prompt: 'A colorful butterfly',
    aspectRatio: '1:1'
  }));
  
  // Test GPT Image
  results.push(await testModel('GPT Image', '/gptimage/generate', {
    prompt: 'A modern city skyline',
    input_image: testImageBase64,
    style: 'realistic',
    aspectRatio: '1:1'
  }));
  
  // Test Qwen Turbo
  results.push(await testModel('Qwen Turbo', '/qwen/generate', {
    prompt: 'A majestic mountain',
    input_image: testImageBase64,
    style: 'realistic',
    aspectRatio: '1:1'
  }));
  
  // Test Qwen Ultra
  results.push(await testModel('Qwen Ultra', '/qwen/edit', {
    prompt: 'An enchanted forest',
    input_image: testImageBase64,
    style: 'fantasy',
    aspectRatio: '1:1'
  }));
  
  console.log('\n================================');
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);
  console.log('================================\n');
}

// Run tests
runTests().catch(console.error);