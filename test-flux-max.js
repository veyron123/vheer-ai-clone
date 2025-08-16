const axios = require('axios');

const FLUX_API_KEY = '2286be72f9c75b12557518051d46c551';
const FLUX_API_URL = 'https://api.kie.ai/api/v1/flux/kontext/generate';
const FLUX_STATUS_URL = 'https://api.kie.ai/api/v1/flux/kontext/record-info';

async function testFluxMax() {
  console.log('Testing Flux Max model generation...\n');

  try {
    // Test 1: Check if flux-max model is accepted
    console.log('Test 1: Sending request with flux-max model...');
    const requestBody = {
      prompt: 'A beautiful landscape with mountains',
      aspectRatio: '1:1',
      model: 'flux-max',  // Testing flux-max directly
      enableTranslation: true,
      outputFormat: 'jpeg'
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(FLUX_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${FLUX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.code === 200 && response.data.data.taskId) {
      const taskId = response.data.data.taskId;
      console.log(`\nTask created successfully with ID: ${taskId}`);
      console.log('Polling for result...');
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await axios.get(`${FLUX_STATUS_URL}?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${FLUX_API_KEY}`
          }
        });
        
        const taskData = statusResponse.data?.data;
        console.log(`Attempt ${attempts}: Status = ${taskData?.successFlag}`);
        
        if (taskData?.successFlag === 1) {
          console.log('\n✅ Generation successful!');
          console.log('Image URL:', taskData.response?.resultImageUrl || taskData.response?.originImageUrl);
          break;
        } else if (taskData?.successFlag === 2 || taskData?.successFlag === 3) {
          console.log('\n❌ Generation failed!');
          console.log('Error:', taskData.errorMessage || 'Unknown error');
          break;
        }
      }
    } else {
      console.log('\n❌ Failed to create task');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n-----------------------------------\n');
  
  // Test 2: Compare flux-pro vs flux-max
  console.log('Test 2: Testing different model names...\n');
  
  const models = ['flux-pro', 'flux-max', 'flux-kontext-pro', 'flux-kontext-max'];
  
  for (const model of models) {
    console.log(`Testing model: ${model}`);
    try {
      const response = await axios.post(FLUX_API_URL, {
        prompt: 'A test image',
        aspectRatio: '1:1',
        model: model,
        enableTranslation: true,
        outputFormat: 'jpeg'
      }, {
        headers: {
          'Authorization': `Bearer ${FLUX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.code === 200) {
        console.log(`✅ ${model}: Accepted (Task ID: ${response.data.data?.taskId})`);
      } else {
        console.log(`⚠️ ${model}: Response code ${response.data?.code}`);
      }
    } catch (error) {
      console.log(`❌ ${model}: ${error.response?.data?.message || error.message}`);
    }
  }
}

testFluxMax();