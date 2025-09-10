import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Frame, ShoppingCart, Maximize, X, ChevronUp, ChevronDown, Palette, Ruler, ZoomIn } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import toast from 'react-hot-toast';
import { viewImage } from '../../utils/imageUtils';

const InlineMockupGenerator = ({ imageUrl, aspectRatio, scale, autoShow = false }) => {
  
  // Функция автоматического определения соотношения сторон
  const detectAspectRatio = (width, height) => {
    const ratio = width / height;
    
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageData, setPreviewImageData] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewType, setPreviewType] = useState(''); // 'frame' or 'original'
  
  const [rotation, setRotation] = useState(0);
  // Индивидуальные настройки scale и position для каждого размера
  const [scalePerSize, setScalePerSize] = useState({});
  const [positionPerSize, setPositionPerSize] = useState({});
  
  // Функция для получения scale для текущего размера (диапазон 5-100%)
  const getCurrentScale = () => {
    if (scalePerSize[selectedSize] !== undefined) {
      return scalePerSize[selectedSize];
    }
    
    // Значения по умолчанию для каждого размера - настройки для основного левого мокапа
    const defaultScales = {
      '6x8': 0.72,   // 72% - для основного мокапа 3:4
      '12x16': 0.72, // 72% - для основного мокапа 3:4
      '18x24': 0.72, // 72% - для основного мокапа 3:4
      '24x32': 0.72, // 72% - для основного мокапа 3:4
      '8x6': 0.71,   // 71% - для 4:3
      '24x18': 0.71, // 71% - для 4:3
      '32x24': 0.71, // 71% - для 4:3
      '10x10': 0.52, // 52% - для 1:1
      '12x12': 0.61, // 61% - для 1:1
      '14x14': 0.69, // 69% - для 1:1
      '16x16': 0.77, // 77% - для 1:1
      '18x18': 0.88  // 88% - для 1:1
    };
    
    return defaultScales[selectedSize] || 0.71; // По умолчанию 71% (как в Mockup Generator 4:3)
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
    
    // Значения по умолчанию для каждого размера - настройки для основного левого мокапа
    const defaultPositions = {
      '6x8': { x: 0, y: 0 },      // X=0px, Y=0px - для основного мокапа 3:4
      '12x16': { x: 0, y: 0 },    // X=0px, Y=0px - для основного мокапа 3:4
      '18x24': { x: 0, y: 0 },    // X=0px, Y=0px - для основного мокапа 3:4
      '24x32': { x: 0, y: 0 },    // X=0px, Y=0px - для основного мокапа 3:4
      '8x6': { x: 0, y: 0 },      // X=0px, Y=0px - для 4:3
      '24x18': { x: 0, y: 0 },    // X=0px, Y=0px - для 4:3
      '32x24': { x: 0, y: 0 },    // X=0px, Y=0px - для 4:3
      '10x10': { x: -1, y: 54 },  // X=-1px, Y=54px - для 1:1
      '12x12': { x: 0, y: 42 },   // X=0px, Y=42px - для 1:1
      '14x14': { x: 0, y: 51 },   // X=0px, Y=51px - для 1:1
      '16x16': { x: 0, y: 61 },   // X=0px, Y=61px - для 1:1
      '18x18': { x: -2, y: 65 }   // X=-2px, Y=65px - для 1:1
    };
    
    return defaultPositions[selectedSize] || { x: 0, y: 0 }; // По умолчанию центрировано (как в Mockup Generator 4:3)
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
      { id: '10x10', name: '10"×10"', price: 70.00 },
      { id: '12x12', name: '12"×12"', price: 80 },
      { id: '14x14', name: '14"×14"', price: 90 },
      { id: '16x16', name: '16"×16"', price: 100 },
      { id: '18x18', name: '18"×18"', price: 120 }
    ],
    '3:4': [
      { id: '6x8', name: '6"×8"', price: 70 },
      { id: '12x16', name: '12"×16"', price: 80 },
      { id: '18x24', name: '18"×24"', price: 90 },
      { id: '24x32', name: '24"×32"', price: 100 }
    ],
    '4:3': [
      { id: '8x6', name: '8"×6"', price: 70 },
      { id: '24x18', name: '24"×18"', price: 90 },
      { id: '32x24', name: '32"×24"', price: 100 }
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
          // Для контекстного предпросмотра используем специфичные Context изображения
          // 8x6 -> Context 1, 8_ x 6_ (Horizontal).png
          // 24x18 -> Context 1, 24″ x 18″ (Horizontal).png
          // 32x24 -> Context 1, 32_ x 24_ (Horizontal).png
          if (size === '8x6') {
            filename = 'Context 1, 8_ x 6_ (Horizontal).png';
          } else if (size === '24x18') {
            filename = 'Context 1, 24″ x 18″ (Horizontal).png';
          } else if (size === '32x24') {
            filename = 'Context 1, 32_ x 24_ (Horizontal).png';
          } else {
            // Fallback для неизвестных размеров
            filename = `${sizeFormattedLandscape}-Context-Preview.png`;
          }
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
        // Для 4:3 используем специфичные изображения для контекста
        const sizeFormattedLandscape2 = size.replace('x', '-');
        if (previewType === 'context') {
          // Используем Context изображения для frame preview
          if (size === '8x6') {
            filename = 'Context 1, 8_ x 6_ (Horizontal).png';
          } else if (size === '24x18') {
            filename = 'Context 1, 24″ x 18″ (Horizontal).png';
          } else if (size === '32x24') {
            filename = 'Context 1, 32_ x 24_ (Horizontal).png';
          } else {
            filename = `${sizeFormattedLandscape2}.png`;
          }
        } else {
          // Для основного предпросмотра
          filename = `${sizeFormattedLandscape2}.png`;
        }
        break;
        
      default:
        // Fallback для неизвестных соотношений
        folderName = 'Frames 1-1';
        filename = 'frame-1x1.png';
        break;
    }
    
    return `/Mockup images/${folderName}/${filename}`;
  };

  // Мемоизированный путь к frame для избежания повторных вызовов
  const framePath = useMemo(() => {
    return getMockupFramePath(selectedSize, selectedColor);
  }, [selectedSize, selectedColor]);

  // Мемоизированная конфигурация рамок
  const currentFrame = useMemo(() => {
    const frameConfigs = {
      '1:1': {
        name: 'Square Frame 1:1',
        frame: framePath,
      },
      '3:4': {
        name: 'Portrait Frame 3:4',
        frame: framePath,
      },
      '4:3': {
        name: 'Landscape Frame 4:3',
        frame: framePath,
      }
    };
    return frameConfigs[detectedAspectRatio] || frameConfigs['1:1'];
  }, [detectedAspectRatio, framePath]);

  // Функция для создания мокапа в Frame Preview
  const renderFramePreview = (size, canvasRef) => {
    if (!imageUrl || !canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер canvas для frame preview (увеличен до 365px)
    const previewSize = 365;
    canvas.width = previewSize;
    canvas.height = previewSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const userImg = new Image();
    userImg.crossOrigin = 'anonymous';
    
    userImg.onload = () => {
      const autoDetectedRatio = detectAspectRatio(userImg.width, userImg.height);
      
      // Функция для отрисовки изображения в frame preview
      const drawUserImageInPreview = (img, ctx, canvas, aspectRatio) => {
        ctx.save();
        
        // Отступы рамки (пропорционально для 365px)
        const frameMargin = 36; // ~10% от 365px
        const innerWidth = canvas.width - (frameMargin * 2);
        const innerHeight = canvas.height - (frameMargin * 2);
        const innerX = frameMargin;
        const innerY = frameMargin;
        
        // Frame Preview использует фиксированные настройки по умолчанию
        const defaultScales = {
          // Настройки для 4:3 (ландшафт)
          '8x6': 0.22,   // 22%
          '24x18': 0.42, // 42%
          '32x24': 0.44, // 44%
          // Настройки для 3:4 (портрет) - специфичные для Frame Preview
          '6x8': 0.22,   // 22%
          '12x16': 0.41, // 41%
          '18x24': 0.38, // 38%
          '24x32': 0.44, // 44%
        };
        const defaultPositions = {
          // Позиции для 4:3 (ландшафт)
          '8x6': { x: -11, y: -58 },
          '24x18': { x: -5, y: -122 },
          '32x24': { x: -7, y: -177 },
          // Позиции для 3:4 (портрет) - специфичные для Frame Preview
          '6x8': { x: -11, y: -64 },
          '12x16': { x: -13, y: -112 },
          '18x24': { x: -4, y: -122 },
          '24x32': { x: -11, y: -186 },
        };
        
        // Получаем фиксированные настройки для Frame Preview
        const previewScale = defaultScales[selectedSize] || 0.85;
        const previewPosition = defaultPositions[selectedSize] || { x: 0, y: 0 };
        
        // Определяем размеры изображения
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio === '3:4' || aspectRatio === '4:3') {
          const imgAspect = img.width / img.height;
          const innerAspect = innerWidth / innerHeight;
          
          if (imgAspect > innerAspect) {
            drawWidth = innerWidth * previewScale;
            drawHeight = (innerWidth / imgAspect) * previewScale;
          } else {
            drawHeight = innerHeight * previewScale;
            drawWidth = (innerHeight * imgAspect) * previewScale;
          }
        } else {
          const size = Math.min(innerWidth, innerHeight) * previewScale;
          drawWidth = size;
          drawHeight = size;
        }
        
        // Центрируем изображение с фиксированными настройками для Frame Preview
        const previewScaleFactor = 0.3; // Коэффициент масштабирования позиции для preview
        drawX = innerX + (innerWidth - drawWidth) / 2 + (previewPosition.x * previewScaleFactor);
        drawY = innerY + (innerHeight - drawHeight) / 2 + (previewPosition.y * previewScaleFactor);
        
        // Рисуем изображение
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      };
      
      // Загружаем рамку для данного размера
      const frameImg = new Image();
      frameImg.onload = () => {
        // Сначала рисуем пользовательское изображение
        drawUserImageInPreview(userImg, ctx, canvas, autoDetectedRatio);
        // Затем рамку поверх
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      };
      
      frameImg.onerror = (error) => {
        // Fallback - простая рамка
        drawUserImageInPreview(userImg, ctx, canvas, autoDetectedRatio);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 9;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      };
      
      // Для Frame Preview используем Context изображения
      const contextFramePath = getMockupFramePathWithRatio(size, selectedColor, 'context', autoDetectedRatio);
      frameImg.src = contextFramePath;
    };
    
    // Проксируем внешние изображения для Frame Preview (кроме доверенных доменов)
    const shouldProxy = imageUrl.startsWith('http') && 
      !imageUrl.includes('i.ibb.co') && 
      !imageUrl.includes('res.cloudinary.com');
    
    const proxiedImageUrlForPreview = shouldProxy
      ? `/api/image-proxy/proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
      
    userImg.src = proxiedImageUrlForPreview;
  };

  // Автоматический показ при появлении изображения
  useEffect(() => {
    if (autoShow && imageUrl) {
      if (!hasShownAuto) {
        setHasShownAuto(true);
      }
      setIsVisible(true);
    }
  }, [imageUrl, autoShow, hasShownAuto]);

  // Сброс только при полном удалении изображения
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
  
  // Мемоизированный ключ для перерисовки основного мокапа
  const mainCanvasRenderKey = useMemo(() => {
    if (!imageUrl || !isVisible) return null;
    return `${imageUrl}_${detectedAspectRatio}_${selectedSize}_${JSON.stringify(scalePerSize[selectedSize])}_${JSON.stringify(positionPerSize[selectedSize])}_${rotation}`;
  }, [imageUrl, detectedAspectRatio, selectedSize, scalePerSize, positionPerSize, rotation, isVisible]);

  // Рендеринг основного мокапа - объединенный useEffect
  useEffect(() => {
    if (!imageUrl || !isVisible || !mainCanvasRef.current) {
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');

      // Устанавливаем временный размер canvas
      canvas.width = 800;
      canvas.height = 600;
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
        // Автоматическое определение соотношения сторон
        const autoDetectedRatio = detectAspectRatio(img.width, img.height);

        if (autoDetectedRatio !== detectedAspectRatio) {
          setDetectedAspectRatio(autoDetectedRatio);
          setSelectedSize(getDefaultSize(autoDetectedRatio));
        }

        // Динамический размер canvas - будет изменен после загрузки рамки
        let canvasWidth = 500;
        let canvasHeight = 500;

        // Функция для отрисовки пользовательского изображения под рамкой
        const drawUserImageFirst = (img, ctx, canvas, aspectRatio) => {
          ctx.save();
          
          // Размеры белой области внутри рамки
          const frameMargin = 30;
          const innerWidth = canvas.width - (frameMargin * 2);
          const innerHeight = canvas.height - (frameMargin * 2);
          const innerX = frameMargin;
          const innerY = frameMargin;
          
          // Динамические настройки для основного canvas
          const mainCanvasScale = getCurrentScale();
          const mainCanvasPosition = getCurrentPosition();

          // Определяем как вписать изображение в белую область
          let drawWidth, drawHeight, drawX, drawY;
          
          if (aspectRatio === '3:4' || aspectRatio === '4:3') {
            const imgAspect = img.width / img.height;
            const innerAspect = innerWidth / innerHeight;
            
            if (imgAspect > innerAspect) {
              drawWidth = innerWidth * mainCanvasScale;
              drawHeight = (innerWidth / imgAspect) * mainCanvasScale;
            } else {
              drawHeight = innerHeight * mainCanvasScale;
              drawWidth = (innerHeight * imgAspect) * mainCanvasScale;
            }
          } else {
            const size = Math.min(innerWidth, innerHeight) * mainCanvasScale;
            drawWidth = size;
            drawHeight = size;
          }
          
          // Позиционирование изображения с настройками пользователя
          drawX = innerX + (innerWidth - drawWidth) / 2 + mainCanvasPosition.x;
          drawY = innerY + (innerHeight - drawHeight) / 2 + mainCanvasPosition.y;
          
          // Применяем поворот если нужно
          if (rotation !== 0) {
            const centerX = drawX + drawWidth / 2;
            const centerY = drawY + drawHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          // Рисуем белый фон для области изображения
          ctx.fillStyle = 'white';
          ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
          
          // Рисуем изображение
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          ctx.restore();
        };

        // Меняем размер canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Очищаем и заливаем серым
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Загружаем рамку, а затем рисуем изображение и рамку
        const frameImg = new Image();
        frameImg.onload = () => {
          // Адаптируем размер canvas под размер рамки мокапа
          const maxSize = 500;
          const frameAspect = frameImg.width / frameImg.height;
          
          if (frameAspect > 1) {
            // Горизонтальная рамка
            canvasWidth = maxSize;
            canvasHeight = maxSize / frameAspect;
          } else {
            // Вертикальная или квадратная рамка
            canvasHeight = maxSize;
            canvasWidth = maxSize * frameAspect;
          }
          
          // Устанавливаем новые размеры canvas
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // Очищаем и заливаем серым с новыми размерами
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Сначала рисуем пользовательское изображение
          drawUserImageFirst(img, ctx, canvas, autoDetectedRatio);
          // Затем рисуем рамку поверх с её оригинальными пропорциями
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          setIsLoading(false);
        };
        frameImg.onerror = (error) => {
          // Попробуем JPG версию для 4:3
          if (frameImg.src.includes('.png') && autoDetectedRatio === '4:3') {
            frameImg.src = '/Mockup images/Frames 4-3/Front, 8_ x 6_ (Horizontal).jpg';
            return;
          }
          
          // Сначала рисуем пользовательское изображение
          drawUserImageFirst(img, ctx, canvas, autoDetectedRatio);
          
          // Затем простая черная рамка в случае ошибки
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 15;
          ctx.strokeRect(7.5, 7.5, canvas.width - 15, canvas.height - 15);
          
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 2;
          ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
          
          setIsLoading(false);
        };

        // Используем правильные пути к рамкам для каждого соотношения сторон в зависимости от размера
        let framePath;
        if (autoDetectedRatio === '3:4') {
          // Для 3:4 всегда используем 6-8.png для левого мокапа (Preview)
          framePath = `/Mockup images/Frames 3-4/6-8.png`;
        } else if (autoDetectedRatio === '4:3') {
          framePath = '/Mockup images/Frames 4-3/Front, 8_ x 6_ (Horizontal).png';
        } else {
          // Для 1:1 используем динамические selectedSize и selectedColor
          const sizeFormatted = selectedSize.replace('x', '-');
          framePath = `/Mockup images/Frames 1-1/${sizeFormatted}${selectedColor}.png`;
        }
        frameImg.src = framePath;
      };

      userImg.onload = () => {
        renderImageOnCanvas(userImg);
      };
      
      // Проксируем только внешние изображения, исключая доверенные домены (IMGBB, Cloudinary)
      const shouldProxyMainCanvas = imageUrl.startsWith('http') && 
        !imageUrl.includes('i.ibb.co') && 
        !imageUrl.includes('res.cloudinary.com');
      
      const proxiedImageUrl = shouldProxyMainCanvas
        ? `/api/image-proxy/proxy?url=${encodeURIComponent(imageUrl)}`
        : imageUrl;
        
      userImg.crossOrigin = 'anonymous';
      userImg.src = proxiedImageUrl;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [imageUrl, isVisible, detectedAspectRatio, selectedSize, selectedColor, rotation, scalePerSize, positionPerSize]);


  // Мемоизированный ключ для Frame Preview
  const framePreviewRenderKey = useMemo(() => {
    if (!imageUrl || !isVisible || !selectedSize) return null;
    return `${imageUrl}_${detectedAspectRatio}_${selectedSize}_${selectedColor}`;
  }, [imageUrl, detectedAspectRatio, selectedSize, selectedColor, isVisible]);

  // Мемоизированная функция рендеринга Frame Preview
  const renderMemoizedFramePreview = useCallback(() => {
    if (!framePreviewRenderKey || !frameCanvasRef.current) {
      return;
    }
    renderFramePreview(selectedSize, { current: frameCanvasRef.current });
  }, [framePreviewRenderKey, selectedSize]);

  // Синхронизация мокапа в Frame Preview
  useEffect(() => {
    if (framePreviewRenderKey) {
      const timeoutId = setTimeout(() => {
        renderMemoizedFramePreview();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [framePreviewRenderKey, renderMemoizedFramePreview]);

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
      size: selectedSize, // используем выбранный размер
      sizeName: selectedSizeData?.name || selectedSize, // используем название выбранного размера
      price: selectedSizeData?.price || 70, // используем цену выбранного размера
      aspectRatio: detectedAspectRatio,
      rotation: rotation,
      scale: getCurrentScale(), // используем настройки пользователя
      position: getCurrentPosition(), // используем настройки пользователя
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

  // Просмотр мокапа в новом окне
  const viewMockup = () => {
    if (!mainCanvasRef.current) return;
    
    // Конвертируем canvas в data URL
    const dataURL = mainCanvasRef.current.toDataURL('image/png');
    
    // Открываем в новом окне
    viewImage(dataURL);
  };

  // Показать модальное окно с Frame Preview
  const showFramePreviewModal = () => {
    if (!imageUrl) return;
    
    try {
      // Создаем высококачественный canvas для модального окна
      const highResCanvas = document.createElement('canvas');
      const highResSize = 1200; // Высокое разрешение для четкого отображения
      highResCanvas.width = highResSize;
      highResCanvas.height = highResSize;
      const ctx = highResCanvas.getContext('2d');
      
      ctx.clearRect(0, 0, highResCanvas.width, highResCanvas.height);
      
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      
      userImg.onload = () => {
        const autoDetectedRatio = detectAspectRatio(userImg.width, userImg.height);
        
        // Функция для отрисовки высококачественного изображения
        const drawHighResPreview = (img, ctx, canvas, aspectRatio) => {
          ctx.save();
          
          // Отступы рамки (пропорционально для высокого разрешения)
          const frameMargin = Math.round(highResSize * 0.1); // 10% отступ
          const innerWidth = canvas.width - (frameMargin * 2);
          const innerHeight = canvas.height - (frameMargin * 2);
          const innerX = frameMargin;
          const innerY = frameMargin;
          
          // Используем те же настройки масштаба, но пересчитанные для высокого разрешения
          const defaultScales = {
            '8x6': 0.22,   '24x18': 0.42, '32x24': 0.44,
            '6x8': 0.22,   '12x16': 0.41, '18x24': 0.38, '24x32': 0.44,
          };
          const defaultPositions = {
            '8x6': { x: -11, y: -58 },     '24x18': { x: -5, y: -122 },   '32x24': { x: -7, y: -177 },
            '6x8': { x: -11, y: -64 },     '12x16': { x: -13, y: -112 },  '18x24': { x: -4, y: -122 }, '24x32': { x: -11, y: -186 },
          };
          
          const previewScale = defaultScales[selectedSize] || 0.85;
          const previewPosition = defaultPositions[selectedSize] || { x: 0, y: 0 };
          
          let drawWidth, drawHeight;
          
          if (aspectRatio === '3:4' || aspectRatio === '4:3') {
            const imgAspect = img.width / img.height;
            const innerAspect = innerWidth / innerHeight;
            
            if (imgAspect > innerAspect) {
              drawWidth = innerWidth * previewScale;
              drawHeight = (innerWidth / imgAspect) * previewScale;
            } else {
              drawHeight = innerHeight * previewScale;
              drawWidth = (innerHeight * imgAspect) * previewScale;
            }
          } else {
            const size = Math.min(innerWidth, innerHeight) * previewScale;
            drawWidth = size;
            drawHeight = size;
          }
          
          // Позиционирование с учетом высокого разрешения
          const scaleFactor = highResSize / 365; // Коэффициент масштабирования от маленького превью
          const drawX = innerX + (innerWidth - drawWidth) / 2 + (previewPosition.x * 0.3 * scaleFactor);
          const drawY = innerY + (innerHeight - drawHeight) / 2 + (previewPosition.y * 0.3 * scaleFactor);
          
          // Рисуем изображение
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        };
        
        // Загружаем рамку высокого разрешения
        const frameImg = new Image();
        frameImg.onload = () => {
          drawHighResPreview(userImg, ctx, highResCanvas, autoDetectedRatio);
          ctx.drawImage(frameImg, 0, 0, highResCanvas.width, highResCanvas.height);
          
          // Создаем data URL из высококачественного canvas
          const dataURL = highResCanvas.toDataURL('image/png');
          setPreviewImageData(dataURL);
          setPreviewTitle(`Frame Preview - ${currentFrameSizes.find(s => s.id === selectedSize)?.name}`);
          setPreviewType('frame');
          setShowPreviewModal(true);
        };
        
        frameImg.onerror = () => {
          // Fallback с простой рамкой
          drawHighResPreview(userImg, ctx, highResCanvas, autoDetectedRatio);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.round(highResSize * 0.02); // Пропорциональная толщина
          ctx.strokeRect(Math.round(highResSize * 0.01), Math.round(highResSize * 0.01), 
                        highResCanvas.width - Math.round(highResSize * 0.02), 
                        highResCanvas.height - Math.round(highResSize * 0.02));
          
          const dataURL = highResCanvas.toDataURL('image/png');
          setPreviewImageData(dataURL);
          setPreviewTitle(`Frame Preview - ${currentFrameSizes.find(s => s.id === selectedSize)?.name}`);
          setPreviewType('frame');
          setShowPreviewModal(true);
        };
        
        // Загружаем рамку
        const contextFramePath = getMockupFramePathWithRatio(selectedSize, selectedColor, 'context', autoDetectedRatio);
        frameImg.src = contextFramePath;
      };
      
      // Проксируем изображение (кроме доверенных доменов)
      const shouldProxyModal = imageUrl.startsWith('http') && 
        !imageUrl.includes('i.ibb.co') && 
        !imageUrl.includes('res.cloudinary.com');
      
      const proxiedImageUrl = shouldProxyModal
        ? `/api/image-proxy/proxy?url=${encodeURIComponent(imageUrl)}`
        : imageUrl;
        
      userImg.src = proxiedImageUrl;
      
    } catch (error) {
      console.error('Error creating high-res preview:', error);
    }
  };

  // Показать модальное окно с Frame Preview (используем ту же высококачественную функцию)
  const showOriginalImageModal = () => {
    // Используем ту же функцию высококачественного превью
    showFramePreviewModal();
  };

  // Закрыть модальное окно
  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewImageData(null);
    setPreviewTitle('');
    setPreviewType('');
  };

  // Обработка клавиш для модального окна
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPreviewModal) {
        closePreviewModal();
      }
    };

    if (showPreviewModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Блокируем скролл страницы при открытом модальном окне
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPreviewModal]);

  if (!imageUrl) {
    return null;
  }

  return (
    <>
    <div className="relative">
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Заголовок с кнопкой показать/скрыть */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Frame className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Wall Art
          </h3>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded font-medium">
            {detectedAspectRatio}
          </span>
          {isVisible && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded font-medium">
              {currentFrameSizes.find(s => s.id === selectedSize)?.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isVisible && (
            <button
              onClick={() => setIsVisible(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
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
          <div className="grid lg:grid-cols-2">
            {/* Превью */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="bg-gray-50 rounded-lg flex items-center justify-center relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
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
            <div className="space-y-4 lg:pl-6">
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
                        <div className={`relative ${selectedColor === color.id ? 'ring-2 ring-orange-500 ring-offset-2' : ''} rounded-lg transition-all`}>
                          <div 
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ 
                              backgroundColor: color.color,
                              borderColor: color.borderColor
                            }}
                          >
                            {selectedColor === color.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {(detectedAspectRatio === '3:4' || detectedAspectRatio === '4:3') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Frame Preview - {currentFrameSizes.find(s => s.id === selectedSize)?.name}
                  </label>
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden mx-auto relative" style={{ width: '365px', height: '365px' }}>
                      <canvas
                        ref={frameCanvasRef}
                        width={365}
                        height={365}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                      {/* View Frame Preview Button */}
                      {!isLoading && imageUrl && (
                        <button
                          onClick={showFramePreviewModal}
                          className="absolute bottom-2 right-2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                          title="View Frame Preview"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                      )}
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
                <div className={`grid ${detectedAspectRatio === '4:3' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {currentFrameSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedSize === size.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">{size.name}</div>
                      <div className="text-xs text-gray-500">${size.price}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Scale Control - открыто для всех соотношений сторон */}
              {(
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="w-4 h-4 inline mr-1" />
                    Scale
                  </label>
                  
                  <div className="flex items-center space-x-3">
                    <label className="text-xs text-gray-600 w-12">Scale:</label>
                    <input
                      type="number"
                      value={Math.round(getCurrentScale() * 100)}
                      onChange={(e) => setCurrentScale((parseInt(e.target.value) || 50) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      step="1"
                      min="10"
                      max="200"
                      placeholder="85"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      const defaultScales = {
                        '6x8': 0.71,   // 71% для основного мокапа 3:4
                        '12x16': 0.71, // 71% для основного мокапа 3:4
                        '18x24': 0.71, // 71% для основного мокапа 3:4
                        '24x32': 0.71, // 71% для основного мокапа 3:4
                        '8x6': 0.71,   // Для 4:3
                        '24x18': 0.71, // Для 4:3
                        '32x24': 0.71, // Для 4:3
                        '10x10': 0.52, // Для 1:1
                        '12x12': 0.61, // Для 1:1
                        '14x14': 0.69, // Для 1:1
                        '16x16': 0.77, // Для 1:1
                        '18x18': 0.88  // Для 1:1
                      };
                      setCurrentScale(defaultScales[selectedSize] || 0.71);
                    }}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    Reset Scale
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-3">
                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors font-semibold shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  ADD TO CART - ${currentFrameSizes.find(s => s.id === selectedSize)?.price || 70}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Modal for Frame Preview */}
      {showPreviewModal && previewImageData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Закрываем модальное окно при клике по фону
            if (e.target === e.currentTarget) {
              closePreviewModal();
            }
          }}
        >
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[50vw] h-[50vw] overflow-auto flex flex-col">
            {/* Close Button */}
            <button
              onClick={closePreviewModal}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
              title="Close Preview"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Header */}
            <div className="mb-4 pr-12">
              <h3 className="text-lg font-semibold text-gray-900">
                {previewTitle}
              </h3>
              {previewType === 'original' && (
                <p className="text-sm text-gray-600 mt-1">
                  Source image for mockup generation
                </p>
              )}
            </div>
            
            {/* Preview Image */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center flex-1 min-h-0">
              <img
                src={previewImageData}
                alt="Frame Preview"
                className="w-full h-full object-contain rounded"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            {/* Actions */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Click outside or press ESC to close
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Download the preview
                    const link = document.createElement('a');
                    if (previewType === 'frame') {
                      link.download = `frame-preview-${selectedSize}-${detectedAspectRatio}.png`;
                    } else {
                      link.download = `original-image.png`;
                    }
                    link.href = previewImageData;
                    link.click();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={closePreviewModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default InlineMockupGenerator;