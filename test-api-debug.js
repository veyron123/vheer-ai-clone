const axios = require('axios');

const FLUX_API_KEY = '2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0';
const FLUX_API_URL = 'https://api.kie.ai/api/v1/flux/kontext/generate';

async function testAPI() {
  console.log('Testing Flux API with different aspect ratios...\n');

  const requestBody = {
    prompt: 'A beautiful landscape',
    aspectRatio: '4:3',
    model: 'flux-kontext-pro',
    enableTranslation: true,
    outputFormat: 'jpeg'
  };
  
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await axios.post(FLUX_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${FLUX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.taskId) {
      console.log('\n✅ Task ID received:', response.data.data.taskId);
    } else {
      console.log('\n❌ No task ID in response');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testAPI();