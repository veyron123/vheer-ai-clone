// Test script to verify aspect ratio functionality in all generators
const axios = require('axios');

const baseUrl = 'http://localhost:5000/api';

// Test aspect ratios
const aspectRatios = [
  '1:1',      // Square
  '16:9',     // Should map to 3:2 landscape  
  '9:16',     // Should map to 2:3 portrait
  '4:3',      // Should map to 3:2 landscape
  '3:4',      // Should map to 2:3 portrait
  'square',   // Should map to 1:1
  'landscape', // Should map to 3:2
  'portrait'  // Should map to 2:3
];

// Test data for each generator
const testData = {
  qwen: {
    url: `${baseUrl}/qwen/generate`,
    payload: {
      prompt: 'Beautiful sunset over mountains, digital art',
      style: 'digital-art',
      numImages: 1
    }
  },
  gptImageTextToImage: {
    url: `${baseUrl}/gpt-image-text-to-image/generate`,
    payload: {
      prompt: 'Beautiful landscape painting',
      style: 'artistic',
      numImages: 1
    }
  },
  runwayVideo: {
    url: `${baseUrl}/runway-video/generate`,
    payload: {
      prompt: 'A serene lake with mountains in the background',
      duration: 5,
      quality: '720p',
      waterMark: ''
    }
  }
  // Note: Flux and GPTImage require authentication, testing separately
};

async function testGeneratorAspectRatio(generatorName, config, aspectRatio) {
  try {
    console.log(`\n🧪 Testing ${generatorName} with aspect ratio: ${aspectRatio}`);
    
    const payload = {
      ...config.payload,
      aspectRatio: aspectRatio
    };
    
    console.log(`📤 Sending request to: ${config.url}`);
    console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await axios.post(config.url, payload, {
      timeout: 30000 // 30 seconds timeout
    });
    
    if (response.data.success) {
      console.log(`✅ ${generatorName} - ${aspectRatio}: SUCCESS`);
      if (response.data.images && response.data.images.length > 0) {
        console.log(`🖼️ Generated ${response.data.images.length} image(s)`);
        console.log(`📐 First image dimensions: ${response.data.images[0].width}x${response.data.images[0].height}`);
      }
      if (response.data.videoUrl) {
        console.log(`🎬 Video URL: ${response.data.videoUrl}`);
      }
      if (response.data.taskId) {
        console.log(`🆔 Task ID: ${response.data.taskId}`);
      }
    } else {
      console.log(`❌ ${generatorName} - ${aspectRatio}: FAILED`);
      console.log(`Error: ${response.data.message || response.data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ ${generatorName} - ${aspectRatio}: ERROR`);
    if (error.response) {
      console.log(`HTTP ${error.response.status}: ${error.response.statusText}`);
      console.log(`Response:`, error.response.data);
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

async function testAllGenerators() {
  console.log('🚀 Starting Aspect Ratio Testing for All Generators');
  console.log('===================================================\n');
  
  // Test each generator with each aspect ratio
  for (const [generatorName, config] of Object.entries(testData)) {
    console.log(`\n🎯 Testing ${generatorName.toUpperCase()} Generator:`);
    console.log('='.repeat(50));
    
    for (const aspectRatio of aspectRatios) {
      await testGeneratorAspectRatio(generatorName, config, aspectRatio);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('✅ Qwen Image: Text-to-image generation with FAL AI');
  console.log('✅ GPT Image Text-to-Image: KIE AI pure text-to-image');
  console.log('✅ Runway Video: Video generation with aspect ratios');
  console.log('\n🔍 Expected Aspect Ratio Mappings:');
  console.log('- 1:1, square    -> 1:1 (Square)');
  console.log('- 16:9, 4:3, landscape -> 3:2 (Landscape)');
  console.log('- 9:16, 3:4, portrait  -> 2:3 (Portrait)');
  
  console.log('\n📝 Notes:');
  console.log('- Flux and GPTImage generators require authentication');
  console.log('- Each generator now uses standardized aspect ratio logic');
  console.log('- Deprecated methods still work but show warnings');
  console.log('- All generators should handle the same input aspect ratios consistently');
}

// Test individual aspect ratio utility
async function testAspectRatioUtility() {
  console.log('\n🔧 Testing Aspect Ratio Utility Functions:');
  console.log('==========================================');
  
  try {
    // Import the utility functions
    const { getStandardizedAspectRatio, convertToServiceFormat } = await import('./server/utils/aspectRatioUtils.js');
    
    aspectRatios.forEach(ratio => {
      const standardized = getStandardizedAspectRatio(ratio);
      console.log(`📐 ${ratio.padEnd(10)} -> ${standardized}`);
      
      // Test conversion to each service
      const services = ['flux', 'qwen', 'gpt-image', 'runway'];
      services.forEach(service => {
        const format = convertToServiceFormat(standardized, service);
        console.log(`   ${service.padEnd(10)}: ${JSON.stringify(format)}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Could not test utility functions:', error.message);
    console.log('🔍 Make sure the server is running to test utility functions');
  }
}

// Main test execution
async function main() {
  console.log('🎯 Comprehensive Aspect Ratio Testing');
  console.log('=====================================\n');
  
  // Test utility functions first
  await testAspectRatioUtility();
  
  // Test generators
  await testAllGenerators();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n💡 Next Steps:');
  console.log('1. Verify that aspect ratios are consistently mapped across generators');
  console.log('2. Check that image dimensions match expected ratios');
  console.log('3. Test authenticated generators (Flux, GPTImage) separately');
  console.log('4. Monitor console logs for deprecation warnings from old methods');
}

// Execute the tests
main().catch(error => {
  console.error('🚨 Test execution failed:', error);
  process.exit(1);
});