import axios from 'axios';

const API_KEY = 'b5cfe077850a194e434914eedd7111d5';
const API_URL = 'https://api.kie.ai/api/v1/runway';

async function testRunwayAPI() {
  console.log('🧪 Testing Runway API...\n');

  try {
    // Step 1: Generate video
    console.log('📤 Step 1: Sending generation request...');
    const generateResponse = await axios.post(
      `${API_URL}/generate`,
      {
        prompt: 'A cute brown kitten playing with a red ball',
        duration: 5,
        quality: '720p',
        aspectRatio: '16:9',
        waterMark: ''
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Generation response:', JSON.stringify(generateResponse.data, null, 2));
    
    const taskId = generateResponse.data?.data?.taskId;
    if (!taskId) {
      console.error('❌ No task ID received');
      return;
    }

    console.log(`\n📋 Task ID: ${taskId}\n`);

    // Step 2: Check status multiple times
    console.log('📤 Step 2: Checking status...\n');
    
    for (let i = 0; i < 5; i++) {
      console.log(`Attempt ${i + 1}/5:`);
      
      try {
        // Try different endpoint formats
        const endpoints = [
          `${API_URL}/status/${taskId}`,
          `${API_URL}/status?taskId=${taskId}`,
          `${API_URL}/task/${taskId}`,
          `${API_URL}/result/${taskId}`
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`  Trying: ${endpoint}`);
            const statusResponse = await axios.get(endpoint, {
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            
            console.log(`  ✅ Success! Response:`, JSON.stringify(statusResponse.data, null, 2));
            break;
          } catch (err) {
            console.log(`  ❌ Failed: ${err.response?.status || err.message}`);
          }
        }
      } catch (error) {
        console.error(`  Error: ${error.message}`);
      }

      // Wait 10 seconds before next attempt
      if (i < 4) {
        console.log('\n  Waiting 10 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testRunwayAPI();