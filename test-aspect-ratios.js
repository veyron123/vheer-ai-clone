const axios = require('axios');

const FLUX_API_KEY = '2286be72f9c75b12557518051d46c551';
const FLUX_API_URL = 'https://api.kie.ai/api/v1/flux/kontext/generate';

async function testAspectRatios() {
  console.log('Testing different aspect ratios with Flux API...\n');

  // Test different aspect ratios
  const aspectRatios = [
    '1:1',      // Square
    '16:9',     // Landscape
    '9:16',     // Portrait
    '4:3',      // Album
    '3:4',      // Portrait Album
    '3:2',      // Photo
    '2:3',      // Portrait Photo
  ];

  for (const ratio of aspectRatios) {
    console.log(`\nTesting aspect ratio: ${ratio}`);
    
    try {
      const requestBody = {
        prompt: 'A beautiful landscape with mountains and a lake',
        aspectRatio: ratio,
        model: 'flux-kontext-pro',
        enableTranslation: true,
        outputFormat: 'jpeg'
      };
      
      const response = await axios.post(FLUX_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${FLUX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.code === 200) {
        console.log(`✅ ${ratio}: Accepted (Task ID: ${response.data.data?.taskId})`);
      } else {
        console.log(`⚠️ ${ratio}: Response code ${response.data?.code} - ${response.data?.msg}`);
      }
    } catch (error) {
      console.log(`❌ ${ratio}: ${error.response?.data?.msg || error.message}`);
    }
  }
  
  console.log('\n-----------------------------------');
  console.log('Testing with input image...\n');
  
  // Test with a sample image URL
  const testImageUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600';
  
  for (const ratio of ['1:1', '16:9', '9:16']) {
    console.log(`\nTesting aspect ratio ${ratio} with input image`);
    
    try {
      const requestBody = {
        prompt: 'Transform into anime style',
        inputImage: testImageUrl,
        aspectRatio: ratio,
        model: 'flux-kontext-pro',
        enableTranslation: true,
        outputFormat: 'jpeg'
      };
      
      const response = await axios.post(FLUX_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${FLUX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.code === 200) {
        console.log(`✅ ${ratio} with image: Accepted (Task ID: ${response.data.data?.taskId})`);
      } else {
        console.log(`⚠️ ${ratio} with image: Response code ${response.data?.code} - ${response.data?.msg}`);
      }
    } catch (error) {
      console.log(`❌ ${ratio} with image: ${error.response?.data?.msg || error.message}`);
    }
  }
}

testAspectRatios();