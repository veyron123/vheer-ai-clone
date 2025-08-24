// Тестовая регистрация для проверки уведомлений
const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('🧪 Создаю тестового пользователя...');
    
    const response = await axios.post('http://localhost:5000/auth/register', {
      email: `test-${Date.now()}@example.com`,
      username: `test-user-${Date.now()}`,
      password: 'test123456',
      fullName: 'Test User для уведомлений'
    });
    
    console.log('✅ Тестовый пользователь создан:', response.data.user);
    console.log('💡 Проверьте админ панель - должно прийти уведомление!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестового пользователя:', error.response?.data || error.message);
  }
};

testRegistration();