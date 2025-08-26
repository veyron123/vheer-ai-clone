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
  const mainCanvasRef = useRef(null); // Основной canvas для детального предпросмотра
  const frameCanvasRef = useRef(null); // Canvas для frame preview
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug isVisible changes
  useEffect(() => {
    console.log('🔄 isVisible changed to:', isVisible);
  }, [isVisible]);
  
  // Debug isLoading changes
  useEffect(() => {
    console.log('🔄 isLoading changed to:', isLoading);
  }, [isLoading]);
  const [rotation, setRotation] = useState(0);
  // Индивидуальные настройки scale и position для каждого размера
  const [scalePerSize, setScalePerSize] = useState({});
  const [positionPerSize, setPositionPerSize] = useState({});
  
  // Функция для получения scale для текущего размера (диапазон 5-100%)
  const getCurrentScale = () => {
    if (scalePerSize[selectedSize] !== undefined) {
      return scalePerSize[selectedSize];
    }
    
    // Значения по умолчанию для каждого размера
    const defaultScales = {
      '6x8': 0.26,   // 26%
      '12x16': 0.43, // 43%
      '18x24': 0.40, // 40%
      '24x32': 0.47  // 47%
    };
    
    return defaultScales[selectedSize] || 0.9; // Основной canvas теперь 90%
  };
  
  // Функция для установки scale для текущего размера
  const setCurrentScale = (newScale) => {
    setScalePerSize(prev => ({
      ...prev,
      [selectedSize]: newScale
    }));
  };
  
  // Функция для получения position для текущего размера
  const getCurrentPosition = () => {
    if (positionPerSize[selectedSize] !== undefined) {
      return positionPerSize[selectedSize];
    }
    
    // Значения по умолчанию для каждого размера
    const defaultPositions = {
      '6x8': { x: -5, y: -22 },  // X=-5px, Y=-22px
      '12x16': { x: -4, y: -39 }, // X=-4px, Y=-39px
      '18x24': { x: 0, y: -41 }, // Y=-41px
      '24x32': { x: 0, y: -70 }  // Y=-70px
    };
    
    return defaultPositions[selectedSize] || { x: 0, y: 0 }; // По умолчанию центрировано
  };
  
  // Функция для установки position для текущего размера
  const setCurrentPosition = (newPosition) => {
    setPositionPerSize(prev => ({
      ...prev,
      [selectedSize]: newPosition
    }));
  };
  
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
        const sizeFormatted = size.replace('x', '-');
        if (previewType === 'context') {
          // Для контекстного предпросмотра: "10-10black-Context-Preview.png" (если есть)
          filename = `${sizeFormatted}${color}-Context-Preview.png`;
        } else {
          // Для основного: "10-10black.png"
          filename = `${sizeFormatted}${color}.png`;
        }
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
        const sizeFormattedLandscape = size.replace('x', '-');
        if (previewType === 'context') {
          // Для контекстного предпросмотра: "8-6-Context-Preview.png" (если есть)
          filename = `${sizeFormattedLandscape}-Context-Preview.png`;
        } else {
          // Для основного предпросмотра: "8-6.png"
          filename = `${sizeFormattedLandscape}.png`;
        }
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

  // Функция для создания мокапа в Frame Preview
  const renderFramePreview = (size, canvasRef) => {
    console.log('🎨 renderFramePreview called:', {
      size,
      imageUrl: imageUrl ? 'exists' : 'missing',
      canvasRefReady: canvasRef.current ? 'ready' : 'not ready',
      selectedColor,
      detectedAspectRatio
    });
    
    if (!imageUrl || !canvasRef.current) {
      console.log('❌ renderFramePreview: Early return - missing requirements');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер canvas для frame preview (увеличен до 160px)
    const previewSize = 160;
    canvas.width = previewSize;
    canvas.height = previewSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const userImg = new Image();
    userImg.crossOrigin = 'anonymous';
    
    userImg.onload = () => {
      console.log('✅ Frame Preview: User image loaded');
      const autoDetectedRatio = detectAspectRatio(userImg.width, userImg.height);
      
      // Функция для отрисовки изображения в frame preview
      const drawUserImageInPreview = (img, ctx, canvas, aspectRatio) => {
        ctx.save();
        
        // Отступы рамки (пропорционально для 160px)
        const frameMargin = 16; // ~10% от 160px
        const innerWidth = canvas.width - (frameMargin * 2);
        const innerHeight = canvas.height - (frameMargin * 2);
        const innerX = frameMargin;
        const innerY = frameMargin;
        
        // Определяем размеры изображения
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio === '3:4' || aspectRatio === '4:3') {
          const imgAspect = img.width / img.height;
          const innerAspect = innerWidth / innerHeight;
          
          if (imgAspect > innerAspect) {
            drawWidth = innerWidth * getCurrentScale();
            drawHeight = (innerWidth / imgAspect) * getCurrentScale();
          } else {
            drawHeight = innerHeight * getCurrentScale();
            drawWidth = (innerHeight * imgAspect) * getCurrentScale();
          }
        } else {
          const size = Math.min(innerWidth, innerHeight) * getCurrentScale();
          drawWidth = size;
          drawHeight = size;
        }
        
        // Центрируем изображение с учетом position
        const currentPos = getCurrentPosition();
        drawX = innerX + (innerWidth - drawWidth) / 2 + (currentPos.x * 0.3); // масштабируем для preview
        drawY = innerY + (innerHeight - drawHeight) / 2 + (currentPos.y * 0.3); // масштабируем для preview
        
        // Рисуем изображение
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      };
      
      // Загружаем рамку для данного размера
      const frameImg = new Image();
      frameImg.onload = () => {
        console.log('✅ Frame Preview: Context frame loaded:', frameImg.src);
        // Сначала рисуем пользовательское изображение
        drawUserImageInPreview(userImg, ctx, canvas, autoDetectedRatio);
        // Затем рамку поверх
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        console.log('✅ Frame Preview: Rendering completed!');
      };
      
      frameImg.onerror = (error) => {
        console.error('❌ Frame Preview: Context frame failed to load:', frameImg.src, error);
        // Fallback - простая рамка
        drawUserImageInPreview(userImg, ctx, canvas, autoDetectedRatio);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        console.log('✅ Frame Preview: Fallback rendering completed!');
      };
      
      // Для Frame Preview используем Context изображения
      const contextFramePath = getMockupFramePathWithRatio(size, selectedColor, 'context', autoDetectedRatio);
      console.log('🖼️ Frame Preview: Loading context frame:', contextFramePath);
      frameImg.src = contextFramePath;
    };
    
    // Проксируем внешние изображения для Frame Preview
    const proxiedImageUrlForPreview = imageUrl.startsWith('http') 
      ? `/api/image-proxy/proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
      
    console.log('🎨 Frame Preview: Using proxied image:', proxiedImageUrlForPreview);
    userImg.src = proxiedImageUrlForPreview;
  };

  // Автоматический показ при появлении изображения
  useEffect(() => {
    console.log('🔍 Auto-show check:', {
      autoShow,
      imageUrl: imageUrl ? 'exists' : 'missing',
      hasShownAuto,
      willShow: autoShow && imageUrl && !hasShownAuto
    });
    
    if (autoShow && imageUrl) {
      if (!hasShownAuto) {
        console.log('✅ Auto-showing mockup generator (first time)');
        setHasShownAuto(true);
      } else {
        console.log('✅ Auto-showing mockup generator (image changed)');
      }
      
      // Показываем мокап немедленно для любого нового изображения
      console.log('🔄 Setting isVisible to TRUE');
      setIsVisible(true);
    }
  }, [imageUrl, autoShow, hasShownAuto]);

  // Сброс только при полном удалении изображения
  useEffect(() => {
    console.log('🔄 Image change detected:', {
      imageUrl: imageUrl ? 'exists' : 'missing',
      willReset: !imageUrl
    });
    
    if (!imageUrl) {
      console.log('🧹 Resetting mockup state (no image)');
      console.log('🔄 Setting isVisible to FALSE');
      setIsVisible(false);
      setHasShownAuto(false);
      setIsExpanded(true);
    } else {
      // Когда появляется новое изображение и мокап уже был показан, оставляем его видимым
      console.log('🔄 New image detected, keeping mockup visible if already shown');
    }
  }, [imageUrl]);

  // Сброс размера при изменении соотношения сторон
  useEffect(() => {
    setSelectedSize(getDefaultSize(detectedAspectRatio));
  }, [detectedAspectRatio]);

  // Рендеринг мокапа
  useEffect(() => {
    console.log('🔥 MAIN CANVAS useEffect STARTED!');
    console.log('🎨 Main Mockup render effect triggered:', { 
      imageUrl: imageUrl ? 'exists' : 'missing', 
      isVisible, 
      detectedAspectRatio,
      selectedSize,
      mainCanvasRef: mainCanvasRef.current ? 'ready' : 'not ready'
    });
    
    if (!imageUrl || !isVisible) {
      console.log('❌ Main Canvas: Stopping render - imageUrl:', imageUrl ? 'exists' : 'missing', 'isVisible:', isVisible);
      setIsLoading(false);
      return;
    }
    
    if (!mainCanvasRef.current) {
      console.log('❌ Main Canvas: Canvas ref not ready, retrying in 100ms');
      const timeout = setTimeout(() => {
        setIsLoading(true);
      }, 100);
      return () => clearTimeout(timeout);
    }
    
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 🔍 DEBUG: Проверяем canvas и context
    console.log('🔍 Canvas details:', {
      canvas: !!canvas,
      ctx: !!ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyle: canvas.style.width + 'x' + canvas.style.height
    });
    
    // ВРЕМЕННО установим размер - будем менять после загрузки изображения
    canvas.width = 800; // временный размер
    canvas.height = 600; // временный размер
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const userImg = new Image();
    
    userImg.onerror = (error) => {
      console.error('❌ Main Canvas: User image failed to load:', error);
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        console.log('✅ Main Canvas: Fallback image loaded');
        renderImageOnCanvas(fallbackImg);
      };
      fallbackImg.onerror = () => {
        console.error('❌ Main Canvas: Fallback image also failed');
        setIsLoading(false);
      };
      fallbackImg.src = imageUrl;
    };
    
    const renderImageOnCanvas = (img) => {
      console.log('🚀 MAIN CANVAS: renderImageOnCanvas CALLED!');
      console.log('🎨 Main Canvas: Starting renderImageOnCanvas with:', {
        imageWidth: img.width,
        imageHeight: img.height,
        selectedSize,
        selectedColor,
        detectedAspectRatio,
        imageUrl,
        isVisible
      });
      
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
        
        // 🎯 КРИТИЧЕСКИЙ ФИКС: Также обновляем размер для нового соотношения сторон
        const newDefaultSize = getDefaultSize(autoDetectedRatio);
        console.log('🔄 Auto-updating size for aspect ratio change:', selectedSize, '→', newDefaultSize);
        setSelectedSize(newDefaultSize);
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
        const frameMargin = 30; // уменьшенные отступы рамки в пикселях
        const innerWidth = canvas.width - (frameMargin * 2);
        const innerHeight = canvas.height - (frameMargin * 2);
        const innerX = frameMargin;
        const innerY = frameMargin;
        
        // 🎯 ФИКСИРОВАННЫЕ НАСТРОЙКИ ДЛЯ ОСНОВНОГО CANVAS
        const mainCanvasScale = 0.85; // увеличенный масштаб 85% для лучшей видимости
        const mainCanvasPosition = { x: 0, y: 0 }; // центрировано
        
        // 🎯 ОПРЕДЕЛЯЕМ КАК ВПИСАТЬ ИЗОБРАЖЕНИЕ В БЕЛУЮ ОБЛАСТЬ
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio === '3:4' || aspectRatio === '4:3') {
          // Для прямоугольных изображений - вписываем с сохранением пропорций
          const imgAspect = img.width / img.height;
          const innerAspect = innerWidth / innerHeight;
          
          if (imgAspect > innerAspect) {
            // Изображение шире - ограничиваем по ширине
            drawWidth = innerWidth * mainCanvasScale;
            drawHeight = (innerWidth / imgAspect) * mainCanvasScale;
          } else {
            // Изображение выше - ограничиваем по высоте
            drawHeight = innerHeight * mainCanvasScale;
            drawWidth = (innerHeight * imgAspect) * mainCanvasScale;
          }
        } else {
          // Для квадратных изображений - используем меньшую сторону
          const size = Math.min(innerWidth, innerHeight) * mainCanvasScale;
          drawWidth = size;
          drawHeight = size;
        }
        
        // 📍 ЦЕНТРИРУЕМ ИЗОБРАЖЕНИЕ В БЕЛОЙ ОБЛАСТИ (фиксированная позиция)
        drawX = innerX + (innerWidth - drawWidth) / 2 + mainCanvasPosition.x;
        drawY = innerY + (innerHeight - drawHeight) / 2 + mainCanvasPosition.y;
        
        // 🔄 ПРИМЕНЯЕМ ПОВОРОТ ЕСЛИ НУЖНО
        if (rotation !== 0) {
          const centerX = drawX + drawWidth / 2;
          const centerY = drawY + drawHeight / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }
        
        console.log('🖼️ Main Canvas: Drawing user image first (under frame):', {
          aspectRatio,
          innerArea: `${innerWidth}x${innerHeight}`,
          imageSize: `${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}`,
          position: `${drawX.toFixed(0)}, ${drawY.toFixed(0)}`,
          scale: mainCanvasScale,
          rotation,
          note: 'Fixed 85% scale for main canvas'
        });
        
        // 🎨 РИСУЕМ БЕЛЫЙ ФОН ДЛЯ ОБЛАСТИ ИЗОБРАЖЕНИЯ (для лучшей видимости)
        ctx.fillStyle = 'white';
        ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
        
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
        console.log('✅ Main Canvas: Frame image loaded successfully:', {
          src: frameImg.src,
          aspectRatio: detectedAspectRatio,
          dimensions: `${frameImg.width}x${frameImg.height}`,
          selectedSize,
          selectedColor
        });
        
        // 🖼️ ЭТАП 1: РИСУЕМ ПОЛЬЗОВАТЕЛЬСКОЕ ИЗОБРАЖЕНИЕ СНАЧАЛА
        console.log('🎨 Main Canvas: Drawing user image first...');
        console.log('🔍 Main Canvas: Image details:', {
          imgExists: !!img,
          imgComplete: img?.complete,
          imgWidth: img?.width || 'UNDEFINED',
          imgHeight: img?.height || 'UNDEFINED',
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          aspectRatio: autoDetectedRatio
        });
        
        if (!img || !img.complete) {
          console.error('❌ Main Canvas: User image not ready in frameImg.onload!');
          return;
        }
        
        drawUserImageFirst(img, ctx, canvas, autoDetectedRatio);
        
        // 🎨 ЭТАП 2: РИСУЕМ РАМКУ ПОВЕРХ ИЗОБРАЖЕНИЯ
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        
        console.log('✅ Main Canvas: Frame drawn successfully');
        console.log('🔍 Canvas state:', {
          width: canvas.width,
          height: canvas.height,
          hasContext: !!ctx,
          frameImgLoaded: frameImg.complete,
          userImgLoaded: userImg.complete
        });
        
        // Main canvas rendering completed
        setIsLoading(false);
      };
      frameImg.onerror = (error) => {
        console.error('❌ Main Canvas: Frame image failed to load:', {
          src: frameImg.src,
          aspectRatio: detectedAspectRatio,
          selectedSize,
          selectedColor,
          error
        });
        
        // Сначала рисуем пользовательское изображение
        console.log('🎨 Main Canvas: Drawing user image (fallback mode)...');
        drawUserImageFirst(img, ctx, canvas, autoDetectedRatio);
        
        // Затем рисуем простую черную рамку
        console.warn('🔄 Main Canvas: Falling back to programmatic frame for:', detectedAspectRatio);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        console.log('✅ Main Canvas: Fallback rendering completed!');
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
      
      // Выбираем правильную рамку в зависимости от соотношения сторон
      if (autoDetectedRatio === '1:1') {
        // Для квадратных изображений
        frameImg.src = '/Mockup images/Frames 1-1/12-12white.png';
        console.log('🖼️ Using square frame for 1:1 image:', frameImg.src);
      } else if (autoDetectedRatio === '3:4') {
        // Для портретных изображений 3:4
        frameImg.src = '/Mockup images/Frames 3-4/6-8.png';
        console.log('🖼️ Using portrait frame for 3:4 image:', frameImg.src);
      } else if (autoDetectedRatio === '4:3') {
        // Для ландшафтных изображений 4:3
        frameImg.src = '/Mockup images/Frames 4-3/8-6.png';
        console.log('🖼️ Using landscape frame for 4:3 image:', frameImg.src);
      } else {
        // Fallback
        frameImg.src = '/Mockup images/Frames 1-1/12-12white.png';
        console.log('🖼️ Using fallback frame:', frameImg.src);
      }
    };
    
    // Устанавливаем обработчик успешной загрузки
    userImg.onload = () => {
      console.log('✅ Main Canvas: User image loaded successfully');
      renderImageOnCanvas(userImg);
    };
    
    // Проксируем внешние изображения через наш сервер для обхода CORS
    const proxiedImageUrl = imageUrl.startsWith('http') 
      ? `/api/image-proxy/proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
      
    userImg.crossOrigin = 'anonymous';
    userImg.src = proxiedImageUrl;
    console.log('🔄 Main Canvas: Loading user image from:', proxiedImageUrl, '(original:', imageUrl, ')');
    console.log('🔄 Main Canvas: useEffect completed setup, waiting for image to load...');
    console.log('🔥 MAIN CANVAS useEffect ENDED - image loading started!');
    
  }, [imageUrl, detectedAspectRatio, rotation, isVisible]); // Main canvas не зависит от scalePerSize/positionPerSize

  // Синхронизация мокапа в Frame Preview (только для выбранного размера)
  useEffect(() => {
    console.log('🖼️ Frame Preview useEffect triggered:', {
      imageUrl: imageUrl ? 'exists' : 'missing',
      isVisible,
      selectedSize,
      detectedAspectRatio,
      selectedColor,
      frameCanvasRefReady: frameCanvasRef.current ? 'ready' : 'not ready'
    });
    
    if (!imageUrl || !isVisible || !selectedSize) {
      console.log('❌ Frame Preview: Stopping - missing requirements');
      return;
    }
    
    console.log('🔄 Frame Preview: Updating for selected size:', selectedSize, '(using Context images)');
    
    // Обновляем мокап только для выбранного размера
    const canvasRef = frameCanvasRef.current;
    if (canvasRef) {
      console.log('🎨 Frame Preview: Starting render with timeout...');
      setTimeout(() => {
        renderFramePreview(selectedSize, { current: canvasRef });
      }, 100); // Небольшая задержка для корректного рендеринга
    } else {
      console.log('❌ Frame Preview: Canvas ref not ready');
    }
    
  }, [imageUrl, detectedAspectRatio, selectedColor, scalePerSize, positionPerSize, rotation, isVisible, selectedSize]);

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
      size: '8x6', // фиксированный размер для основного canvas
      sizeName: '8"×6"', // фиксированное название
      price: 1, // фиксированная цена для основного canvas
      aspectRatio: detectedAspectRatio,
      rotation: rotation,
      scale: 0.7, // фиксированный scale 70% для основного canvas
      position: { x: 0, y: 0 }, // фиксированная позиция по центру
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
    if (!mainCanvasRef.current) return;
    
    const link = document.createElement('a');
    const sizeText = detectedAspectRatio === '1:1' ? `-${selectedSize}` : '';
    link.download = `mockup-${selectedColor}-${detectedAspectRatio}${sizeText}.png`;
    link.href = mainCanvasRef.current.toDataURL();
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
                  ref={mainCanvasRef}
                  className={`max-w-full h-auto ${isLoading ? 'invisible' : 'visible'}`}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Frame Color Selection - только для 1:1 */}
              {detectedAspectRatio === '1:1' && (
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
              )}

              {/* Frame Preview - динамический мокап для выбранного размера */}
              {(detectedAspectRatio === '3:4' || detectedAspectRatio === '4:3' || detectedAspectRatio === '1:1') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Frame Preview - {currentFrameSizes.find(s => s.id === selectedSize)?.name}
                  </label>
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden mx-auto" style={{ width: '160px', height: '160px' }}>
                      <canvas
                        ref={frameCanvasRef}
                        width={160}
                        height={160}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
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
              
{/* Position controls are hidden but functionality remains */}

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