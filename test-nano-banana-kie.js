import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token'; // Замените на реальный токен пользователя

async function testNanoBananaTextToImage() {
  console.log('🧪 Testing Nano-Banana Text-to-Image with KIE API...\n');
  
  try {
    const response = await fetch(`${API_URL}/nano-banana/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        prompt: 'A futuristic city with flying cars and neon lights at night',
        aspectRatio: '16:9'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Text-to-Image Success!');
      console.log('📸 Generated Image:', result.image);
      console.log('💳 Credits Used:', result.credits?.used);
      console.log('🏷️ Provider:', result.metadata?.provider);
      console.log('🤖 Model:', result.metadata?.model);
    } else {
      console.error('❌ Text-to-Image Failed:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testNanoBananaImageToImage() {
  console.log('\n🧪 Testing Nano-Banana Image-to-Image with KIE API...\n');
  
  // Using a sample image URL for testing
  const sampleImageUrl = 'https://picsum.photos/512/512';
  
  try {
    const response = await fetch(`${API_URL}/nano-banana/image-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        prompt: 'Transform this into an anime style artwork with vibrant colors',
        input_image: sampleImageUrl,
        aspectRatio: '1:1'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Image-to-Image Success!');
      console.log('📸 Generated Image:', result.image);
      console.log('💳 Credits Used:', result.credits?.used);
      console.log('🏷️ Provider:', result.metadata?.provider);
      console.log('🤖 Model:', result.metadata?.model);
    } else {
      console.error('❌ Image-to-Image Failed:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting Nano-Banana KIE API Integration Tests\n');
console.log('=' .repeat(50));
console.log('⚠️  Note: You need to replace TEST_TOKEN with a valid user token');
console.log('⚠️  You can get a token by logging in to the application');
console.log('=' .repeat(50) + '\n');

// Uncomment to run tests with a valid token
// await testNanoBananaTextToImage();
// await testNanoBananaImageToImage();

console.log('\n✅ Test script ready. Uncomment the test functions and add a valid token to run.');