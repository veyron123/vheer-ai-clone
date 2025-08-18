import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Code, Package, ArrowRight, Cpu, Brush, Zap } from 'lucide-react';
import { getLanguageFromPath } from '../i18n/config';

const MockupTestPage = () => {
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  const mockupOptions = [
    {
      id: 'canvas',
      title: 'Canvas API',
      subtitle: 'Полный контроль над пикселями',
      description: 'Мощный подход с использованием Canvas API для создания сложных композиций и эффектов',
      icon: <Code className="w-8 h-8" />,
      path: `/${currentLang}/mockup-canvas`,
      color: 'blue',
      features: [
        'Пиксельная точность',
        'Сложные трансформации',
        'Кастомные эффекты',
        'Прямой экспорт'
      ],
      pros: [
        'Полный контроль',
        'Высокая производительность',
        'Без зависимостей'
      ],
      cons: [
        'Сложная реализация',
        'Больше кода'
      ]
    },
    {
      id: 'css',
      title: 'CSS 3D Transforms',
      subtitle: 'Интерактивные 3D эффекты',
      description: 'Простое решение с использованием CSS для создания впечатляющих 3D презентаций',
      icon: <Brush className="w-8 h-8" />,
      path: `/${currentLang}/mockup-css`,
      color: 'green',
      features: [
        'Плавные анимации',
        '3D трансформации',
        'GPU ускорение',
        'Простая реализация'
      ],
      pros: [
        'Легко анимировать',
        'Интерактивность',
        'Быстрая разработка'
      ],
      cons: [
        'Ограниченные возможности',
        'Зависит от html2canvas'
      ]
    },
    {
      id: 'library',
      title: 'Готовая библиотека',
      subtitle: 'Профессиональные шаблоны',
      description: 'Использование специализированной библиотеки с готовыми шаблонами и стилями',
      icon: <Package className="w-8 h-8" />,
      path: `/${currentLang}/mockup-library`,
      color: 'purple',
      features: [
        'Готовые шаблоны',
        'Быстрая интеграция',
        'Профессиональный вид',
        'API методы'
      ],
      pros: [
        'Минимум кода',
        'Много вариантов',
        'Обновления'
      ],
      cons: [
        'Дополнительная зависимость',
        'Размер бандла'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Тестирование мокапов
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Выберите один из трёх вариантов реализации для создания профессиональных мокапов
            </p>
          </div>

          {/* Карточки вариантов */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {mockupOptions.map((option) => (
              <div
                key={option.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`h-2 bg-gradient-to-r ${
                  option.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  option.color === 'green' ? 'from-green-500 to-green-600' :
                  'from-purple-500 to-purple-600'
                }`} />
                
                <div className="p-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4 ${
                    option.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    option.color === 'green' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {option.icon}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {option.title}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mb-3">
                    {option.subtitle}
                  </p>
                  <p className="text-gray-600 mb-6">
                    {option.description}
                  </p>

                  {/* Функции */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Возможности:</h3>
                    <div className="flex flex-wrap gap-2">
                      {option.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Плюсы и минусы */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 mb-1">Плюсы:</h4>
                      <ul className="space-y-1">
                        {option.pros.map((pro, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            • {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-orange-600 mb-1">Минусы:</h4>
                      <ul className="space-y-1">
                        {option.cons.map((con, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            • {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Кнопка перехода */}
                  <Link
                    to={option.path}
                    className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      option.color === 'blue' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : option.color === 'green'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Попробовать
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Сравнительная таблица */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Сравнение подходов</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Критерий</th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <span>Canvas API</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Brush className="w-4 h-4 text-green-600" />
                        <span>CSS 3D</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span>Библиотека</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Сложность реализации</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-orange-600">Высокая</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Низкая</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Очень низкая</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Возможности</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Безграничные</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-orange-600">Ограниченные</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-blue-600">Зависит от библиотеки</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Производительность</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Отличная</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Отличная</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-blue-600">Хорошая</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Размер кода</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-orange-600">Большой</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Маленький</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-blue-600">Минимальный</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Зависимости</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600">Нет</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-orange-600">html2canvas</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-orange-600">Библиотека</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Рекомендации */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Zap className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Рекомендация</h3>
                <p className="text-lg mb-4">
                  Для production-решения рекомендуем <strong>Canvas API</strong> — он обеспечивает 
                  максимальный контроль и лучшую производительность. CSS 3D отлично подходит для 
                  быстрых прототипов, а готовая библиотека — для проектов с ограниченным временем разработки.
                </p>
                <div className="flex gap-4">
                  <Link
                    to={`/${currentLang}/mockup-canvas`}
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Начать с Canvas API
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupTestPage;