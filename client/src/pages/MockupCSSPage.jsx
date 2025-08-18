import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCw } from 'lucide-react';
import html2canvas from 'html2canvas';

const MockupCSSPage = () => {
  const fileInputRef = useRef(null);
  const mockupRef = useRef(null);
  const [userImage, setUserImage] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState('1x1');
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [scale, setScale] = useState(0.7);

  // Определение доступных рамок
  const frames = {
    '1x1': { width: 500, height: 500, path: '/mockups/frame-1x1.png' },
    '4x3': { width: 600, height: 450, path: '/mockups/frame-4x3.png' }
  };

  // Обработка загрузки изображения
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Скачивание результата используя html2canvas
  const downloadImage = async () => {
    if (!mockupRef.current) return;
    
    try {
      const canvas = await html2canvas(mockupRef.current, {
        backgroundColor: 'transparent',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = 'mockup-css-frame.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error capturing mockup:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Портретная рамка: CSS 3D Transforms
            </h1>
            <p className="text-lg text-gray-600">
              Интерактивные 3D трансформации рамки 1:1 с использованием CSS
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Панель управления */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Настройки</h2>
              
              {/* Загрузка изображения */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Загрузить изображение
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Выбрать изображение
                </button>
              </div>

              {/* Выбор рамки */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выбор рамки
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(frames).map(([key, frame]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFrame(key)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedFrame === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {key}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {frame.width}x{frame.height}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Повороты */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Поворот X: {rotateX}°
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={rotateX}
                    onChange={(e) => setRotateX(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Поворот Y: {rotateY}°
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={rotateY}
                    onChange={(e) => setRotateY(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Поворот Z: {rotateZ}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotateZ}
                    onChange={(e) => setRotateZ(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Масштаб */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Масштаб: {scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Кнопки действий */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRotateX(0);
                    setRotateY(0);
                    setRotateZ(0);
                    setScale(0.7);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Сбросить трансформации
                </button>
                <button
                  onClick={downloadImage}
                  disabled={!userImage}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Скачать результат
                </button>
              </div>
            </div>

            {/* Превью */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">3D Превью</h2>
              <div className="flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 min-h-[600px]" 
                   style={{ perspective: '1000px' }}>
                <div
                  ref={mockupRef}
                  className="relative"
                  style={{ 
                    width: `${frames[selectedFrame].width}px`,
                    height: `${frames[selectedFrame].height}px`,
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {/* Контейнер для изображения и рамки */}
                  <div className="relative w-full h-full">
                    {/* Изображение пользователя */}
                    {userImage && (
                      <div className="absolute inset-0 flex items-center justify-center p-12">
                        <img 
                          src={userImage} 
                          alt="User content"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Placeholder если нет изображения */}
                    {!userImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 m-12 rounded-lg">
                        <p className="text-gray-500">Загрузите изображение</p>
                      </div>
                    )}
                    
                    {/* Рамка поверх изображения */}
                    <img 
                      src={frames[selectedFrame].path}
                      alt="Frame"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 10 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Преимущества и недостатки */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-600">Преимущества CSS 3D</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Простая реализация без сложной логики</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Плавные анимации и переходы</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Отличная производительность с GPU ускорением</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Интерактивность "из коробки"</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-600">Ограничения</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">×</span>
                  <span>Ограниченные возможности для сложных эффектов</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">×</span>
                  <span>Сложности с реалистичными тенями</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">×</span>
                  <span>Зависимость от html2canvas для экспорта</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupCSSPage;