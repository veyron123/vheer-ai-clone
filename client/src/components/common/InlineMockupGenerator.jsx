import React, { useRef, useEffect, useState } from 'react';
import { Frame, ShoppingCart, Maximize, X, ChevronUp, ChevronDown, Palette, Ruler } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import toast from 'react-hot-toast';

const InlineMockupGenerator = ({ imageUrl, aspectRatio, autoShow = false }) => {
  // DEBUG: Логируем когда получаем новое изображение для мокапа
  console.log('🖼️ InlineMockupGenerator received imageUrl:', imageUrl ? 'URL provided' : 'no URL', { autoShow, aspectRatio });
  
  // Функция автоматического определения соотношения сторон
  const detectAspectRatio = (width, height) => {
    const ratio = width / height;
    console.log('🔍 Detecting aspect ratio:', { width, height, ratio });
    
    // Определяем соотношение сторон с небольшой погрешностью
    if (Math.abs(ratio - 1) < 0.1) {
      return '1:1'; // Квадратное ~1.0
    } else if (Math.abs(ratio - (4/3)) < 0.1) {
      return '4:3'; // Landscape ~1.33
    } else if (Math.abs(ratio - (3/4)) < 0.1) {
      return '3:4'; // Portrait ~0.75
    } else if (ratio > 1.2) {
      return '4:3'; // Горизонтальное по умолчанию
    } else if (ratio < 0.9) {
      return '3:4'; // Вертикальное по умолчанию
    } else {
      return '1:1'; // Квадратное по умолчанию
    }
  };
  
  // Состояние для автоматически определенного соотношения сторон
  const [detectedAspectRatio, setDetectedAspectRatio] = useState(aspectRatio || '1:1');
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(0.7);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasShownAuto, setHasShownAuto] = useState(false);
  const [selectedColor, setSelectedColor] = useState('white');
  // Инициализируем размер по умолчанию в зависимости от соотношения сторон
  const getDefaultSize = (ratio) => {
    switch (ratio) {
      case '1:1': return '12x12';
      case '3:4': return '6x8';
      case '4:3': return '8x6';
      default: return '12x12';
    }
  };
  
  const [selectedSize, setSelectedSize] = useState(getDefaultSize(aspectRatio || '1:1'));

  // Конфигурация цветов рамок
  const frameColors = [
    { id: 'black', name: 'Black', color: '#1a1a1a', borderColor: '#000000' },
    { id: 'white', name: 'White', color: '#ffffff', borderColor: '#e5e5e5' }
  ];

  // Конфигурация размеров и цен для разных соотношений сторон
  const frameSizes = {
    '1:1': [
      { id: '10x10', name: '10"×10"', price: 1 },
      { id: '12x12', name: '12"×12"', price: 1 },
      { id: '14x14', name: '14"×14"', price: 1 },
      { id: '16x16', name: '16"×16"', price: 1 },
      { id: '18x18', name: '18"×18"', price: 1 }
    ],
    '3:4': [
      { id: '6x8', name: '6"×8"', price: 1 },
      { id: '12x16', name: '12"×16"', price: 1 },
      { id: '18x24', name: '18"×24"', price: 1 },
      { id: '24x32', name: '24"×32"', price: 1 }
    ],
    '4:3': [
      { id: '8x6', name: '8"×6"', price: 1 },
      { id: '16x12', name: '16"×12"', price: 1 },
      { id: '24x18', name: '24"×18"', price: 1 },
      { id: '32x24', name: '32"×24"', price: 1 }
    ]
  };

  // Получаем размеры для текущего соотношения сторон
  const currentFrameSizes = frameSizes[detectedAspectRatio] || frameSizes['1:1'];

  // Функция для получения пути к мокапу с заданным соотношением сторон
  const getMockupFramePathWithRatio = (size, color, previewType = 'main', aspectRatio) => {
    // Определяем папку на основе переданного соотношения сторон
    let folderName = '';
    let filename = '';
    
    switch (aspectRatio) {
      case '1:1':
        folderName = 'Frames 1-1';
        // Для квадратных используем размер + цвет: "10-10black.png"
        const sizeFormatted = size.replace('x', '-');
        filename = `${sizeFormatted}${color}.png`;
        break;
        
      case '3:4':
        folderName = 'Frames 3-4';
        const sizeFormattedPortrait = size.replace('x', '-');
        if (previewType === 'context') {
          // Для контекстного предпросмотра: "6-8-Context-Preview.png"
          filename = `${sizeFormattedPortrait}-Context-Preview.png`;
        } else {
          // Для основного предпросмотра: "6-8.png"
          filename = `${sizeFormattedPortrait}.png`;
        }
        break;
        
      case '4:3':
        folderName = 'Frames 4-3';
        // Для 4:3 используем только размер без цвета: "8-6.png"
        filename = `${size.replace('x', '-')}.png`;
        break;
        
      default:
        // Fallback для неизвестных соотношений
        folderName = 'Frames 1-1';
        filename = 'frame-1x1.png';
        break;
    }
    
    const fullPath = `/Mockup images/${folderName}/${filename}`;
    
    console.log('🖼️ Frame path with ratio:', { 
      aspectRatio, 
      size, 
      color, 
      previewType,
      folderName, 
      filename, 
      fullPath 
    });
    
    return fullPath;
  };

  // Функция для получения пути к мокапу на основе размера, цвета и типа превью
  const getMockupFramePath = (size, color, previewType = 'main') => {
    // Определяем папку на основе соотношения сторон
    let folderName = '';
    let filename = '';
    
    switch (detectedAspectRatio) {
      case '1:1':
        folderName = 'Frames 1-1';
        // Для квадратных используем размер + цвет: "10-10black.png"
        const sizeFormatted = size.replace('x', '-');
        filename = `${sizeFormatted}${color}.png`;
        break;
        
      case '3:4':
        folderName = 'Frames 3-4';
        const sizeFormattedPortrait = size.replace('x', '-');
        if (previewType === 'context') {
          // Для контекстного предпросмотра: "6-8-Context-Preview.png"
          filename = `${sizeFormattedPortrait}-Context-Preview.png`;
        } else {
          // Для основного предпросмотра: "6-8.png"
          filename = `${sizeFormattedPortrait}.png`;
        }
        break;
        
      case '4:3':
        folderName = 'Frames 4-3';
        // Для 4:3 используем только размер без цвета: "8-6.png"
        filename = `${size.replace('x', '-')}.png`;
        break;
        
      default:
        // Fallback для неизвестных соотношений
        folderName = 'Frames 1-1';
        filename = 'frame-1x1.png';
        break;
    }
    
    const fullPath = `/Mockup images/${folderName}/${filename}`;
    
    console.log('🖼️ Auto-selected mockup:', { 
      detectedAspectRatio, 
      size, 
      color, 
      previewType,
      folderName, 
      filename, 
      fullPath 
    });
    
    return fullPath;
  };

  // Конфигурация рамок для разных соотношений сторон
  const frameConfig = {
    '1:1': {
      name: 'Square Frame 1:1',
      frame: getMockupFramePath(selectedSize, selectedColor),
    },
    '3:4': {
      name: 'Portrait Frame 3:4',
      frame: getMockupFramePath(selectedSize, selectedColor),
    },
    '4:3': {
      name: 'Landscape Frame 4:3',
      frame: getMockupFramePath(selectedSize, selectedColor),
    }
  };

  const currentFrame = frameConfig[detectedAspectRatio] || frameConfig['1:1'];

  // Автоматический показ при появлении изображения
  useEffect(() => {
    if (autoShow && imageUrl && !hasShownAuto) {
      // DEBUG MODE: Показываем мокап сразу после загрузки изображения (для отладки)
      // Закомментировано: setTimeout с задержкой 1000мс для production режима
      // const timer = setTimeout(() => {
      //   setIsVisible(true);
      //   setHasShownAuto(true);
      // }, 1000);
      // return () => clearTimeout(timer);
      
      // IMMEDIATE MOCKUP FOR DEBUG: Показываем мокап немедленно
      setIsVisible(true);
      setHasShownAuto(true);
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

  // Сброс размера при изменении соотношения сторон
  useEffect(() => {
    setSelectedSize(getDefaultSize(detectedAspectRatio));
  }, [detectedAspectRatio]);

  // Рендеринг мокапа
  useEffect(() => {
    console.log('🎨 Mockup render effect triggered:', { 
      imageUrl: imageUrl ? 'exists' : 'missing', 
      isVisible, 
      detectedAspectRatio,
      selectedSize,
      canvasRef: canvasRef.current ? 'ready' : 'not ready'
    });
    
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
    
    // ВРЕМЕННО установим размер - будем менять после загрузки изображения
    canvas.width = 800; // временный размер
    canvas.height = 600; // временный размер
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
      // 📝 РЕВОЛЮЦИОННЫЙ ПОДХОД: Адаптируем размер канваса под изображение!
      const imageAspectRatio = img.width / img.height;
      
      // 🎯 АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ СООТНОШЕНИЯ СТОРОН
      const autoDetectedRatio = detectAspectRatio(img.width, img.height);
      console.log('🎯 Aspect ratio analysis:', {
        currentDetected: detectedAspectRatio,
        autoDetected: autoDetectedRatio,
        imageSize: `${img.width}x${img.height}`,
        imageRatio: (img.width / img.height).toFixed(3),
        willUpdate: autoDetectedRatio !== detectedAspectRatio
      });
      
      if (autoDetectedRatio !== detectedAspectRatio) {
        console.log('🔄 Auto-updating aspect ratio:', detectedAspectRatio, '→', autoDetectedRatio);
        setDetectedAspectRatio(autoDetectedRatio);
      }
      
      // 🎯 ФИКСИРОВАННЫЙ РАЗМЕР КАНВАСА: ВСЕГДА КВАДРАТНЫЙ 1:1
      const canvasSize = 500; // Квадратный canvas 500x500
      const canvasWidth = canvasSize;
      const canvasHeight = canvasSize;
      
      console.log('📐 Canvas dimensions fixed to:', { canvasWidth, canvasHeight, aspectRatio: '1:1' });
      
      // 📋 ФУНКЦИЯ ДЛЯ ОТРИСОВКИ ПОЛЬЗОВАТЕЛЬСКОГО ИЗОБРАЖЕНИЯ (ПОД РАМКОЙ)
      const drawUserImageFirst = (img, ctx, canvas, aspectRatio) => {
        ctx.save();
        
        // 📏 ОПРЕДЕЛЯЕМ РАЗМЕРЫ БЕЛОЙ ОБЛАСТИ ВНУТРИ РАМКИ
        // Рамка обычно имеет отступы ~10% с каждой стороны
        const frameMargin = 50; // отступы рамки в пикселях
        const innerWidth = canvas.width - (frameMargin * 2);
        const innerHeight = canvas.height - (frameMargin * 2);
        const innerX = frameMargin;
        const innerY = frameMargin;
        
        // 🎯 ОПРЕДЕЛЯЕМ КАК ВПИСАТЬ ИЗОБРАЖЕНИЕ В БЕЛУЮ ОБЛАСТЬ
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio === '3:4' || aspectRatio === '4:3') {
          // Для прямоугольных изображений - вписываем с сохранением пропорций
          const imgAspect = img.width / img.height;
          const innerAspect = innerWidth / innerHeight;
          
          if (imgAspect > innerAspect) {
            // Изображение шире - ограничиваем по ширине
            drawWidth = innerWidth * scale;
            drawHeight = (innerWidth / imgAspect) * scale;
          } else {
            // Изображение выше - ограничиваем по высоте
            drawHeight = innerHeight * scale;
            drawWidth = (innerHeight * imgAspect) * scale;
          }
        } else {
          // Для квадратных изображений - используем меньшую сторону
          const size = Math.min(innerWidth, innerHeight) * scale;
          drawWidth = size;
          drawHeight = size;
        }
        
        // 📍 ЦЕНТРИРУЕМ ИЗОБРАЖЕНИЕ В БЕЛОЙ ОБЛАСТИ
        drawX = innerX + (innerWidth - drawWidth) / 2 + position.x;
        drawY = innerY + (innerHeight - drawHeight) / 2 + position.y;
        
        // 🔄 ПРИМЕНЯЕМ ПОВОРОТ ЕСЛИ НУЖНО
        if (rotation !== 0) {
          const centerX = drawX + drawWidth / 2;
          const centerY = drawY + drawHeight / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }
        
        console.log('🖼️ Drawing user image first (under frame):', {
          aspectRatio,
          innerArea: `${innerWidth}x${innerHeight}`,
          imageSize: `${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}`,
          position: `${drawX.toFixed(0)}, ${drawY.toFixed(0)}`,
          scale,
          rotation
        });
        
        // 🎨 РИСУЕМ ИЗОБРАЖЕНИЕ
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      };
      
      // 🎯 УСТАНАВЛИВАЕМ ФИКСИРОВАННЫЙ КВАДРАТНЫЙ РАЗМЕР КАНВАСА
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Очищаем канвас с новыми размерами
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 🖼️ ЭТАП 1: ЗАГРУЖАЕМ РАМКУ И ОТРИСОВЫВАЕМ ВСЁ
      const frameImg = new Image();
      frameImg.onload = () => {
        console.log('✅ Frame image loaded successfully:', {
          src: frameImg.src,
          aspectRatio: detectedAspectRatio,
          dimensions: `${frameImg.width}x${frameImg.height}`,
          selectedSize,
          selectedColor
        });
        
        // 🖼️ ЭТАП 1: РИСУЕМ ПОЛЬЗОВАТЕЛЬСКОЕ ИЗОБРАЖЕНИЕ СНАЧАЛА
        drawUserImageFirst(img, ctx, canvas, autoDetectedRatio);
        
        // 🎨 ЭТАП 2: РИСУЕМ РАМКУ ПОВЕРХ ИЗОБРАЖЕНИЯ
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        
        setIsLoading(false);
      };
      frameImg.onerror = (error) => {
        console.error('❌ Frame image failed to load:', {
          src: frameImg.src,
          aspectRatio: detectedAspectRatio,
          selectedSize,
          selectedColor,
          error
        });
        
        // Если изображение рамки не загрузилось, рисуем простую черную рамку
        console.warn('🔄 Falling back to programmatic frame for:', detectedAspectRatio);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        setIsLoading(false);
      };
      // 🖼️ ВЫБОР РАМКИ НА ОСНОВЕ АВТОМАТИЧЕСКИ ДЕТЕКТИРОВАННОГО СООТНОШЕНИЯ
      console.log('🎨 Frame selection logic:', {
        currentDetected: detectedAspectRatio,
        autoDetected: autoDetectedRatio,
        selectedSize,
        selectedColor,
        explanation: 'Using autoDetected ratio for immediate frame selection'
      });
      
      if (autoDetectedRatio === '1:1') {
        // Для квадратных изображений используем фиксированную рамку
        frameImg.src = '/Mockup images/frame-1x1.png';
        console.log('🖼️ Using fixed frame for 1:1 image:', frameImg.src);
      } else {
        // Для не-квадратных изображений используем динамические рамки из соответствующих папок
        // Временно используем autoDetectedRatio для getMockupFramePath
        const tempDetectedRatio = detectedAspectRatio;
        // Переопределяем глобально для getMockupFramePath
        const framePathWithCorrectRatio = getMockupFramePathWithRatio(selectedSize, selectedColor, 'main', autoDetectedRatio);
        frameImg.src = framePathWithCorrectRatio;
        console.log('🖼️ Using dynamic frame for', autoDetectedRatio, 'image:', frameImg.src);
      }
    };
    
    userImg.onload = () => {
      console.log('✅ User image loaded successfully:', { width: userImg.width, height: userImg.height });
      renderImageOnCanvas(userImg);
    };
    
    userImg.crossOrigin = 'anonymous';
    userImg.src = imageUrl;
    console.log('🔄 Loading user image from:', imageUrl);
    
  }, [imageUrl, detectedAspectRatio, rotation, scale, position, isVisible]);

  const { addItem, openCart } = useCartStore();

  // Добавление в корзину
  const addToCart = async () => {
    if (!imageUrl) return;
    
    // Получаем выбранный размер и цену
    const selectedSizeData = currentFrameSizes.find(s => s.id === selectedSize);
    const selectedColorData = frameColors.find(c => c.id === selectedColor);
    
    // Создаем объект товара для корзины (без canvas экспорта)
    const cartItem = {
      imageUrl: imageUrl, // Используем оригинальное изображение
      originalImageUrl: imageUrl,
      frameColor: selectedColor,
      frameColorName: selectedColorData?.name,
      size: selectedSize,
      sizeName: selectedSizeData?.name,
      price: selectedSizeData?.price || 1,
      aspectRatio: detectedAspectRatio,
      rotation: rotation,
      scale: scale,
      position: position,
      type: 'mockup'
    };
    
    // Добавляем в корзину
    addItem(cartItem);
    
    // Показываем уведомление
    toast.success('Added to cart!', {
      icon: '🛒',
      duration: 2000
    });
    
    // Открываем корзину
    setTimeout(() => {
      openCart();
    }, 500);
  };

  // Скачивание результата (оставляем как дополнительную функцию)
  const downloadMockup = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    const sizeText = detectedAspectRatio === '1:1' ? `-${selectedSize}` : '';
    link.download = `mockup-${selectedColor}-${detectedAspectRatio}${sizeText}.png`;
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
            {detectedAspectRatio}
          </span>
          {isVisible && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded font-medium">
              {currentFrameSizes.find(s => s.id === selectedSize)?.name} - ₴{currentFrameSizes.find(s => s.id === selectedSize)?.price}
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
              {/* Frame Color Selection with Dynamic Preview - только для 1:1 */}
              {detectedAspectRatio === '1:1' && (
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
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
                  
                  {/* Динамический предпросмотр рамки */}
                  <div className="flex-shrink-0">
                    <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ width: '128px' }}>
                      <img 
                        src={getMockupFramePath(selectedSize, selectedColor)}
                        alt={`${selectedSize} ${selectedColor} frame`}
                        className="w-full h-auto block"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-32 bg-gray-200 items-center justify-center text-xs text-gray-500 hidden">
                        No preview
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Frame Preview - для соотношения 3:4 (только Context изображения) */}
              {detectedAspectRatio === '3:4' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Frame Preview
                  </label>
                  <div className="bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden mx-auto" style={{ width: '128px' }}>
                    <img 
                      src={getMockupFramePath(selectedSize, selectedColor, 'context')}
                      alt={`${selectedSize} context frame`}
                      className="w-full h-auto block"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-32 bg-gray-200 items-center justify-center text-xs text-gray-500 hidden">
                      No context
                    </div>
                  </div>
                </div>
              )}

              {/* Frame Preview - для соотношения 4:3 */}
              {detectedAspectRatio === '4:3' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Frame Preview
                  </label>
                  <div className="w-32 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                    <img 
                      src={getMockupFramePath(selectedSize, selectedColor, 'main')}
                      alt={`${selectedSize} frame`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gray-200 items-center justify-center text-xs text-gray-500 hidden">
                      No preview
                    </div>
                  </div>
                </div>
              )}

              {/* Size Selection - для всех соотношений сторон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {currentFrameSizes.map((size) => (
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
                      <div className="text-xs text-gray-500">₴{size.price}</div>
                    </button>
                  ))}
                </div>
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

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                <button
                  onClick={addToCart}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors font-semibold shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  ADD TO CART
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