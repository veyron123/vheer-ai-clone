// Создаем тестовый клик для партнерской ссылки
const testClick = {
  url: 'http://localhost:5178/?ref=OARQMF6RYF7R2A0F9B&fp_sid=test-subid-2025',
  description: 'Тестовая ссылка с Sub ID для проверки статистики'
};

console.log('🔗 Тестовая партнерская ссылка создана:');
console.log('URL:', testClick.url);
console.log('Sub ID:', 'test-subid-2025');
console.log('Партнерский код:', 'OARQMF6RYF7R2A0F9B');
console.log('\n📝 Инструкции для тестирования:');
console.log('1. Откройте новое инкогнито-окно браузера');
console.log('2. Перейдите по ссылке:', testClick.url);
console.log('3. Зарегистрируйте новый тестовый аккаунт');
console.log('4. Проверьте статистику в партнерском кабинете');

export { testClick };