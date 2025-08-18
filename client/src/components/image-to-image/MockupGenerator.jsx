import React, { useRef, useEffect, useState } from 'react';
import { Frame, Download, X } from 'lucide-react';

const MockupGenerator = ({ imageUrl, aspectRatio, onClose }) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(0.7);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Конфигурация рамок
  const frameConfig = {
    '1:1': {
      name: 'Square Frame 1:1',
      width: 600,
      height: 600,
      frame: '/mockups/frame-1x1.png',
      screen: { x: 50, y: 50, width: 500, height: 500 }
    },
    '4:3': {
      name: 'Landscape Frame 4:3',
      width: 800,
      height: 600,
      frame: '/mockups/frame-4x3.png',
      screen: { x: 80, y: 60, width: 640, height: 480 }
    }
  };

  const currentFrame = frameConfig[aspectRatio] || frameConfig['1:1'];

  // Рендеринг мокапа
  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Установка размеров canvas
    canvas.width = currentFrame.width;
    canvas.height = currentFrame.height;
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Загрузка и отрисовка пользовательского изображения
    const userImg = new Image();
    userImg.crossOrigin = 'anonymous';
    userImg.onload = () => {
      ctx.save();
      
      // Применение области обрезки
      const screen = currentFrame.screen;
      ctx.beginPath();
      ctx.rect(screen.x, screen.y, screen.width, screen.height);
      ctx.clip();
      
      // Центрирование и применение трансформаций
      ctx.translate(
        screen.x + screen.width / 2 + position.x,
        screen.y + screen.height / 2 + position.y
      );
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Масштабирование изображения
      const autoScale = Math.max(
        screen.width / userImg.width,
        screen.height / userImg.height
      );
      const finalScale = autoScale * scale;
      
      ctx.drawImage(
        userImg,
        -userImg.width * finalScale / 2,
        -userImg.height * finalScale / 2,
        userImg.width * finalScale,
        userImg.height * finalScale
      );
      
      ctx.restore();
      
      // Загрузка и отрисовка рамки
      const frameImg = new Image();
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        setIsLoading(false);
      };
      frameImg.onerror = () => {
        // Если рамка не загрузилась, рисуем простую рамку
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        setIsLoading(false);
      };
      frameImg.src = currentFrame.frame;
    };
    userImg.src = imageUrl;
    
  }, [imageUrl, aspectRatio, rotation, scale, position, currentFrame]);

  // Скачивание результата
  const downloadMockup = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `mockup-${aspectRatio}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Frame className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-semibold">Создание мокапа</h2>
            <span className="px-2 py-1 bg-gray-100 text-sm rounded">
              {aspectRatio}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Превью */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Превью</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                {isLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Загрузка...</p>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                )}
              </div>
            </div>

            {/* Управление */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Настройки</h3>
              
              {/* Поворот */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
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
              </div>

              {/* Масштаб */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
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
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Позиция
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">X: {position.x}px</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={position.x}
                      onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y: {position.y}px</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={position.y}
                      onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Кнопки */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={() => {
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                    setScale(0.7);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Сбросить настройки
                </button>
                
                <button
                  onClick={downloadMockup}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Скачать мокап
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupGenerator;