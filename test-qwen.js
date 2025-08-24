// Тестовый скрипт для проверки Qwen Image API
const axios = require('axios');

const testQwenImage = async () => {
  try {
    console.log('🧪 Тестируем Qwen Image API...');
    
    // Простая генерация изображения
    const response = await axios.post('http://localhost:5000/api/qwen/generate', {
      prompt: 'Beautiful sunset over mountains, digital art',
      style: 'digital-art',
      aspectRatio: '1:1',
      numImages: 1
    });
    
    console.log('✅ Qwen Image работает!');
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании Qwen Image:', error.response?.data || error.message);
  }
};

testQwenImage();