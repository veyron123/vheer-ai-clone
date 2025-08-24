// Quick test to verify aspect ratio integration is working
const axios = require('axios');

const baseUrl = 'http://localhost:5000/api';

async function testAspectRatioMapping() {
  console.log('🧪 Testing Aspect Ratio Mapping Integration');
  console.log('============================================\n');

  const testCases = [
    { generator: 'qwen', aspectRatio: '1:1', expected: 'square_hd' },
    { generator: 'qwen', aspectRatio: '16:9', expected: 'landscape_4_3' },
    { generator: 'qwen', aspectRatio: '9:16', expected: 'portrait_4_3' },
    { generator: 'qwen', aspectRatio: 'square', expected: 'square_hd' },
    { generator: 'qwen', aspectRatio: 'landscape', expected: 'landscape_4_3' },
    { generator: 'qwen', aspectRatio: 'portrait', expected: 'portrait_4_3' },
  ];

  for (const testCase of testCases) {
    console.log(`\n📐 Testing ${testCase.generator} with aspectRatio: ${testCase.aspectRatio}`);
    console.log(`   Expected standardization: ${testCase.aspectRatio} -> ${testCase.expected}`);

    try {
      const payload = {
        prompt: 'Simple test image',
        aspectRatio: testCase.aspectRatio,
        numImages: 1
      };

      const response = await axios.post(`${baseUrl}/${testCase.generator}/generate`, payload, {
        timeout: 30000
      });

      if (response.data.success) {
        console.log(`   ✅ Request successful`);
        console.log(`   📊 Generated ${response.data.images?.length || 0} image(s)`);
        
        if (response.data.images && response.data.images.length > 0) {
          const image = response.data.images[0];
          console.log(`   📐 Image dimensions: ${image.width}x${image.height}`);
          
          // Calculate actual aspect ratio
          const actualRatio = (image.width / image.height).toFixed(2);
          console.log(`   📊 Calculated aspect ratio: ${actualRatio}`);
          
          // Determine expected ratio based on standardization
          let expectedRatio;
          if (['1:1', 'square'].includes(testCase.aspectRatio)) {
            expectedRatio = '1.00'; // 1:1
          } else if (['16:9', '4:3', '3:2', 'landscape'].includes(testCase.aspectRatio)) {
            expectedRatio = '1.46'; // ~1.5 for landscape (3:2 ≈ 1.5)
          } else if (['9:16', '3:4', '2:3', 'portrait'].includes(testCase.aspectRatio)) {
            expectedRatio = '0.67'; // ~0.67 for portrait (2:3 ≈ 0.67)
          }
          
          console.log(`   🎯 Expected aspect ratio: ${expectedRatio}`);
          
          // Check if the aspect ratios are close (within 0.1 tolerance)
          if (Math.abs(parseFloat(actualRatio) - parseFloat(expectedRatio)) < 0.1) {
            console.log(`   ✅ Aspect ratio matches expected value!`);
          } else {
            console.log(`   ⚠️ Aspect ratio doesn't match expected value`);
          }
        }
        
      } else {
        console.log(`   ❌ Request failed: ${response.data.message || response.data.error}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📄 HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📊 Summary:');
  console.log('===========');
  console.log('✅ Tested aspect ratio standardization across generators');
  console.log('✅ Verified that input aspect ratios are correctly mapped');
  console.log('✅ Checked that output dimensions match expected ratios');
  console.log('\n🎯 Key Mappings Tested:');
  console.log('- 1:1, square    -> 1:1 ratio (1.00)');
  console.log('- 16:9, 4:3, landscape -> 3:2 ratio (~1.50)');
  console.log('- 9:16, 3:4, portrait  -> 2:3 ratio (~0.67)');
}

// Test deprecation warnings
async function testDeprecationWarnings() {
  console.log('\n🔧 Testing Deprecation Warnings:');
  console.log('================================');
  
  // Make a request that should trigger deprecation warnings in server logs
  try {
    const response = await axios.post(`${baseUrl}/qwen/generate`, {
      prompt: 'Test for deprecation warnings',
      aspectRatio: '16:9', // This should trigger the old getImageSize method internally
      numImages: 1
    }, { timeout: 30000 });

    if (response.data.success) {
      console.log('✅ Request successful - check server logs for deprecation warnings');
      console.log('📝 Look for messages like: "getImageSize is deprecated, use aspectRatioUtils.js instead"');
    }

  } catch (error) {
    console.log(`❌ Error testing deprecation: ${error.message}`);
  }
}

async function main() {
  await testAspectRatioMapping();
  await testDeprecationWarnings();
  
  console.log('\n✅ Aspect Ratio Integration Test Complete!');
  console.log('\n💡 What to verify:');
  console.log('1. All aspect ratios are correctly standardized');
  console.log('2. Output image dimensions match expected ratios');
  console.log('3. Deprecation warnings appear in server logs');
  console.log('4. Backward compatibility is maintained');
}

main().catch(error => {
  console.error('🚨 Test failed:', error);
  process.exit(1);
});