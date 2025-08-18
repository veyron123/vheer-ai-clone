import React, { useRef, useEffect, useState } from 'react';
import { Upload, Download, RotateCw } from 'lucide-react';

const MockupCanvasPage = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userImage, setUserImage] = useState(null);
  const [selectedMockup, setSelectedMockup] = useState('square1x1');
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.7);
  const [showDebug, setShowDebug] = useState(false);

  // Определение мокапов с вашими рамками
  const mockups = {
    square1x1: {
      name: 'Square Frame 1:1',
      width: 600,
      height: 600,
      frame: '/mockups/frame-1x1.png',
      // Увеличенная область для полного заполнения прозрачной зоны
      screen: { x: 50, y: 50, width: 500, height: 500 },
      perspective: false,
      ratio: '1:1'
    },
    landscape4x3: {
      name: 'Landscape Frame 4:3',
      width: 800,
      height: 600,
      frame: '/mockups/frame-4x3.png',
      // Область для горизонтальной рамки
      screen: { x: 80, y: 60, width: 640, height: 480 },
      perspective: false,
      ratio: '4:3'
    }
  };

  // Обработка загрузки изображения
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Рендеринг на Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const mockup = mockups[selectedMockup];
    
    // Установка размеров canvas
    canvas.width = mockup.width;
    canvas.height = mockup.height;
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рендеринг пользовательского изображения
    if (userImage) {
      ctx.save();
      
      // Применение области обрезки
      const screen = mockup.screen;
      ctx.beginPath();
      ctx.rect(screen.x, screen.y, screen.width, screen.height);
      ctx.clip();
      
      // Центрирование и применение трансформаций
      ctx.translate(
        screen.x + screen.width / 2 + position.x,
        screen.y + screen.height / 2 + position.y
      );
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Применение перспективы для некоторых мокапов
      if (mockup.perspective) {
        ctx.transform(1, 0, -0.1, 1, 0, 0);
      }
      
      // Масштабирование изображения под область с учетом пользовательского масштаба
      const autoScale = Math.max(
        screen.width / userImage.width,
        screen.height / userImage.height
      );
      const finalScale = autoScale * scale;
      
      ctx.drawImage(
        userImage,
        -userImage.width * finalScale / 2,
        -userImage.height * finalScale / 2,
        userImage.width * finalScale,
        userImage.height * finalScale
      );
      
      ctx.restore();
    }
    
    // Загрузка и отрисовка изображения рамки
    const frameImg = new Image();
    frameImg.onload = () => {
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    };
    frameImg.onerror = () => {
      // Если изображение не загрузилось, рисуем простую рамку
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Внутренняя рамка
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    };
    frameImg.src = mockup.frame;
    
  }, [userImage, selectedMockup, rotation, position, scale]);

  // Скачивание результата
  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `mockup-${selectedMockup}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Портретные рамки: Canvas API
            </h1>
            <p className="text-lg text-gray-600">
              Создание изображений в красивых рамках с соотношением 1:1 и 3:4
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
                  {Object.entries(mockups).map(([key, mockup]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMockup(key)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedMockup === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {mockup.ratio}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {mockup.width}x{mockup.height}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Поворот */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поворот: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
                <button
                  onClick={() => setRotation(0)}
                  className="mt-2 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  <RotateCw className="w-4 h-4 inline mr-1" />
                  Сбросить
                </button>
              </div>

              {/* Масштаб */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Масштаб: {(scale * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Позиция */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Позиция
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">X: {position.x}px</label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={position.x}
                      onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y: {position.y}px</label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={position.y}
                      onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                    setScale(0.7);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Сбросить всё
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
              <h2 className="text-2xl font-semibold mb-4">Превью</h2>
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[600px]">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto shadow-lg"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </div>
          </div>

          {/* Преимущества */}
          <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Преимущества Canvas API</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Полный контроль над пиксельными операциями</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Возможность применения сложных трансформаций и фильтров</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Работа на стороне клиента без необходимости сервера</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Поддержка экспорта в различные форматы изображений</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupCanvasPage;