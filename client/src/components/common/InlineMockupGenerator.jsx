import React, { useRef, useEffect, useState } from 'react';
import { Frame, Download, RotateCw, Move, Maximize, X, ChevronUp, ChevronDown, Palette, Ruler } from 'lucide-react';

const InlineMockupGenerator = ({ imageUrl, aspectRatio, autoShow = false }) => {
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(0.7);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasShownAuto, setHasShownAuto] = useState(false);
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('12x12');

  // Конфигурация цветов рамок
  const frameColors = [
    { id: 'black', name: 'Black', color: '#1a1a1a', borderColor: '#000000' },
    { id: 'white', name: 'White', color: '#ffffff', borderColor: '#e5e5e5' },
    { id: 'redoak', name: 'Red Oak', color: '#8b4513', borderColor: '#6b3410' }
  ];

  // Конфигурация размеров и цен
  const frameSizes = [
    { id: '10x10', name: '10"×10"', price: 70 },
    { id: '12x12', name: '12"×12"', price: 80 },
    { id: '14x14', name: '14"×14"', price: 90 },
    { id: '16x16', name: '16"×16"', price: 100 },
    { id: '18x18', name: '18"×18"', price: 120 }
  ];

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

  // Автоматический показ при появлении изображения
  useEffect(() => {
    if (autoShow && imageUrl && !hasShownAuto) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasShownAuto(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [imageUrl, autoShow, hasShownAuto]);

  // Сброс при изменении изображения
  useEffect(() => {
    if (!imageUrl) {
      setIsVisible(false);
      setHasShownAuto(false);
      setIsExpanded(true);
    }
  }, [imageUrl]);

  // Рендеринг мокапа
  useEffect(() => {
    if (!imageUrl || !isVisible) {
      setIsLoading(false);
      return;
    }
    
    if (!canvasRef.current) {
      const timeout = setTimeout(() => {
        setIsLoading(true);
      }, 100);
      return () => clearTimeout(timeout);
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = currentFrame.width;
    canvas.height = currentFrame.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const userImg = new Image();
    
    userImg.onerror = (error) => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        renderImageOnCanvas(fallbackImg);
      };
      fallbackImg.onerror = () => {
        setIsLoading(false);
      };
      fallbackImg.src = imageUrl;
    };
    
    const renderImageOnCanvas = (img) => {
      // Получаем выбранный цвет рамки
      const selectedFrameColor = frameColors.find(c => c.id === selectedColor);
      const screen = currentFrame.screen;
      
      // 1. Сначала рисуем фон рамки
      ctx.fillStyle = selectedFrameColor.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Внешняя граница рамки
      ctx.strokeStyle = selectedFrameColor.borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
      
      // 3. Внутренняя рамка вокруг изображения
      ctx.strokeStyle = selectedFrameColor.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(screen.x - 2, screen.y - 2, screen.width + 4, screen.height + 4);
      
      // 4. Рисуем изображение
      ctx.save();
      
      // Обрезаем по области экрана
      ctx.beginPath();
      ctx.rect(screen.x, screen.y, screen.width, screen.height);
      ctx.clip();
      
      // Применяем трансформации
      ctx.translate(
        screen.x + screen.width / 2 + position.x,
        screen.y + screen.height / 2 + position.y
      );
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Вычисляем масштаб
      const autoScale = Math.max(
        screen.width / img.width,
        screen.height / img.height
      );
      const finalScale = autoScale * scale;
      
      // Рисуем изображение
      ctx.drawImage(
        img,
        -img.width * finalScale / 2,
        -img.height * finalScale / 2,
        img.width * finalScale,
        img.height * finalScale
      );
      
      ctx.restore();
      
      // 5. Добавляем декоративные элементы для глубины
      if (selectedColor === 'redoak') {
        // Для дерева добавляем текстуру
        ctx.strokeStyle = 'rgba(107, 52, 16, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 10; i < 40; i += 10) {
          ctx.strokeRect(i, i, canvas.width - i * 2, canvas.height - i * 2);
        }
      }
      
      // 6. Внутренняя тень для объема
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = -2;
      ctx.shadowOffsetY = -2;
      ctx.strokeStyle = 'transparent';
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x + 2, screen.y + 2, screen.width - 4, screen.height - 4);
      ctx.restore();
      
      setIsLoading(false);
    };
    
    userImg.onload = () => {
      renderImageOnCanvas(userImg);
    };
    
    userImg.crossOrigin = 'anonymous';
    userImg.src = imageUrl;
    
  }, [imageUrl, aspectRatio, rotation, scale, position, currentFrame, isVisible, selectedColor, frameColors]);

  // Скачивание результата
  const downloadMockup = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    const sizeText = aspectRatio === '1:1' ? `-${selectedSize}` : '';
    link.download = `mockup-${selectedColor}-${aspectRatio}${sizeText}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Заголовок с кнопкой показать/скрыть */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Frame className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Mockup Generator
          </h3>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded font-medium">
            {aspectRatio}
          </span>
          {aspectRatio === '1:1' && isVisible && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded font-medium">
              {frameSizes.find(s => s.id === selectedSize)?.name} - ${frameSizes.find(s => s.id === selectedSize)?.price}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isVisible && (
            <button
              onClick={() => setIsVisible(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Frame className="w-4 h-4" />
              Create Mockup
            </button>
          )}
          
          {isVisible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
          
          {isVisible && (
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Контент мокапа */}
      {isVisible && isExpanded && (
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Превью */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[300px] relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Creating mockup...</p>
                    </div>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={`max-w-full h-auto ${isLoading ? 'invisible' : 'visible'}`}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Settings</h4>
              
              {/* Frame Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Frame color
                </label>
                <div className="flex gap-3">
                  {frameColors.map((color) => (
                    <label
                      key={color.id}
                      className="relative cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="frameColor"
                        value={color.id}
                        checked={selectedColor === color.id}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`relative ${selectedColor === color.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''} rounded-lg transition-all`}>
                        <div 
                          className="w-12 h-12 rounded-lg border-2"
                          style={{ 
                            backgroundColor: color.color,
                            borderColor: color.borderColor
                          }}
                        >
                          {selectedColor === color.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Selection - Only for 1:1 aspect ratio */}
              {aspectRatio === '1:1' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="w-4 h-4 inline mr-1" />
                    Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {frameSizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all ${
                          selectedSize === size.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{size.name}</div>
                        <div className="text-xs text-gray-500">${size.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rotation */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <RotateCw className="w-4 h-4 inline mr-1" />
                  Rotation: {rotation}°
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

              {/* Scale */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <Maximize className="w-4 h-4 inline mr-1" />
                  Scale: {(scale * 100).toFixed(0)}%
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

              {/* Position */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <Move className="w-4 h-4 inline mr-1" />
                  Position
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

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                    setScale(0.7);
                    setSelectedColor('white');
                    setSelectedSize('12x12');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset Settings
                </button>
                
                <button
                  onClick={downloadMockup}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Mockup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineMockupGenerator;