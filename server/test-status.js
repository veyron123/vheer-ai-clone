import axios from 'axios';

const API_KEY = 'b5cfe077850a194e434914eedd7111d5';
const API_URL = 'https://api.kie.ai/api/v1/runway';

async function checkStatus(taskId) {
  console.log('🔍 Checking status for task:', taskId);
  
  try {
    const response = await axios.get(`${API_URL}/record-detail`, {
      params: { taskId: taskId },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      const data = response.data.data;
      console.log('\n📊 Task Details:');
      console.log('  State:', data.state);
      console.log('  Generate Time:', data.generateTime);
      if (data.videoInfo) {
        console.log('  Video URL:', data.videoInfo.videoUrl);
        console.log('  Image URL:', data.videoInfo.imageUrl);
      }
      if (data.failMsg) {
        console.log('  Error:', data.failMsg);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

// Use the task ID from the last generation or provide your own
const taskId = process.argv[2] || 'b0ae8438-fe84-470b-84ee-b67b9a2a45d6';
checkStatus(taskId);