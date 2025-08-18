import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Palette, Layers, Grid } from 'lucide-react';

// Симуляция библиотеки Mockup.js (в реальности это была бы отдельная библиотека)
class MockupJS {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.templates = {
      'phone-hand': {
        name: 'Phone in Hand',
        width: 800,
        height: 600,
        placeholder: { x: 320, y: 150, width: 160, height: 300 }
      },
      'desktop-workspace': {
        name: 'Desktop Workspace',
        width: 1000,
        height: 600,
        placeholder: { x: 250, y: 100, width: 500, height: 300 }
      },
      'tablet-coffee': {
        name: 'Tablet with Coffee',
        width: 800,
        height: 600,
        placeholder: { x: 200, y: 150, width: 400, height: 300 }
      },
      'multi-device': {
        name: 'Multi Device',
        width: 1000,
        height: 600,
        placeholders: [
          { x: 100, y: 200, width: 200, height: 350 },
          { x: 400, y: 150, width: 300, height: 200 },
          { x: 750, y: 250, width: 150, height: 150 }
        ]
      }
    };
  }

  applyTemplate(templateId, userImage, options = {}) {
    const template = this.templates[templateId];
    if (!template) return;

    this.canvas.width = template.width;
    this.canvas.height = template.height;
    
    // Очистка canvas
    this.ctx.fillStyle = options.backgroundColor || '#f3f4f6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Применение фильтров если указаны
    if (options.filter) {
      this.ctx.filter = options.filter;
    }

    // Рисование placeholder областей (имитация устройств)
    if (template.placeholders) {
      // Multi-device template
      template.placeholders.forEach((placeholder, index) => {
        this.drawDevice(placeholder, userImage, options);
      });
    } else {
      // Single device template
      this.drawDevice(template.placeholder, userImage, options);
    }

    // Добавление декоративных элементов
    this.addDecorations(templateId, options);
    
    // Сброс фильтров
    this.ctx.filter = 'none';
  }

  drawDevice(placeholder, userImage, options) {
    const { x, y, width, height } = placeholder;
    
    // Тень устройства
    if (options.shadow) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowOffsetX = 5;
      this.ctx.shadowOffsetY = 5;
    }

    // Рамка устройства
    this.ctx.fillStyle = options.deviceColor || '#1a1a1a';
    this.ctx.fillRect(x - 20, y - 20, width + 40, height + 40);
    
    // Экран
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x, y, width, height);
    
    // Сброс тени
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Изображение пользователя
    if (userImage) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x, y, width, height);
      this.ctx.clip();
      
      const scale = Math.max(width / userImage.width, height / userImage.height);
      const imgWidth = userImage.width * scale;
      const imgHeight = userImage.height * scale;
      const imgX = x + (width - imgWidth) / 2;
      const imgY = y + (height - imgHeight) / 2;
      
      this.ctx.drawImage(userImage, imgX, imgY, imgWidth, imgHeight);
      this.ctx.restore();
    }
  }

  addDecorations(templateId, options) {
    const ctx = this.ctx;
    
    switch(templateId) {
      case 'phone-hand':
        // Рисуем руку (упрощенно)
        ctx.fillStyle = options.handColor || '#f4c2a1';
        ctx.beginPath();
        ctx.ellipse(400, 450, 100, 150, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'desktop-workspace':
        // Клавиатура
        ctx.fillStyle = '#333333';
        ctx.fillRect(350, 450, 300, 80);
        // Мышь
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.ellipse(700, 490, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'tablet-coffee':
        // Кружка кофе
        ctx.fillStyle = options.coffeeColor || '#8b4513';
        ctx.beginPath();
        ctx.arc(650, 300, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(710, 300, 25, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        break;
        
      case 'multi-device':
        // Декоративные линии связи
        ctx.strokeStyle = options.connectionColor || '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(300, 375);
        ctx.lineTo(400, 250);
        ctx.moveTo(700, 250);
        ctx.lineTo(750, 325);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }
  }

  export(format = 'png', quality = 0.9) {
    return this.canvas.toDataURL(`image/${format}`, quality);
  }
}

const MockupLibraryPage = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mockupRef = useRef(null);
  const [userImage, setUserImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('phone-hand');
  const [options, setOptions] = useState({
    backgroundColor: '#f3f4f6',
    deviceColor: '#1a1a1a',
    shadow: true,
    filter: 'none',
    quality: 0.9
  });

  // Инициализация библиотеки
  useEffect(() => {
    if (canvasRef.current) {
      mockupRef.current = new MockupJS(canvasRef.current);
    }
  }, []);

  // Применение шаблона при изменениях
  useEffect(() => {
    if (mockupRef.current && userImage) {
      mockupRef.current.applyTemplate(selectedTemplate, userImage, options);
    } else if (mockupRef.current) {
      // Показать превью без изображения
      mockupRef.current.applyTemplate(selectedTemplate, null, options);
    }
  }, [userImage, selectedTemplate, options]);

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

  // Скачивание результата
  const downloadImage = () => {
    if (!mockupRef.current || !userImage) return;
    
    const dataUrl = mockupRef.current.export('png', options.quality);
    const link = document.createElement('a');
    link.download = `mockup-${selectedTemplate}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Предустановленные стили
  const presets = {
    modern: {
      backgroundColor: '#ffffff',
      deviceColor: '#000000',
      shadow: true,
      filter: 'none'
    },
    vintage: {
      backgroundColor: '#f5e6d3',
      deviceColor: '#8b4513',
      shadow: false,
      filter: 'sepia(0.3)'
    },
    vibrant: {
      backgroundColor: '#ff6b6b',
      deviceColor: '#4ecdc4',
      shadow: true,
      filter: 'saturate(1.5)'
    },
    minimal: {
      backgroundColor: '#fafafa',
      deviceColor: '#e0e0e0',
      shadow: false,
      filter: 'none'
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Мокапы: Готовая библиотека
            </h1>
            <p className="text-lg text-gray-600">
              Использование готовой библиотеки Mockup.js с множеством шаблонов
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Панель управления */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Настройки библиотеки</h2>
              
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

              {/* Выбор шаблона */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Grid className="inline w-4 h-4 mr-1" />
                  Готовые шаблоны
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(mockupRef.current?.templates || {}).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                        selectedTemplate === key
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs opacity-75">
                        {template.width}x{template.height}px
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Предустановленные стили */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="inline w-4 h-4 mr-1" />
                  Быстрые стили
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(presets).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => setOptions({ ...options, ...preset })}
                      className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 capitalize"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Детальные настройки */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цвет фона
                  </label>
                  <input
                    type="color"
                    value={options.backgroundColor}
                    onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цвет устройства
                  </label>
                  <input
                    type="color"
                    value={options.deviceColor}
                    onChange={(e) => setOptions({ ...options, deviceColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="shadow"
                    checked={options.shadow}
                    onChange={(e) => setOptions({ ...options, shadow: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="shadow" className="text-sm font-medium text-gray-700">
                    Добавить тень
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фильтры
                  </label>
                  <select
                    value={options.filter}
                    onChange={(e) => setOptions({ ...options, filter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="none">Без фильтра</option>
                    <option value="grayscale(1)">Черно-белый</option>
                    <option value="sepia(0.5)">Сепия</option>
                    <option value="blur(2px)">Размытие</option>
                    <option value="saturate(2)">Насыщенность</option>
                    <option value="contrast(1.5)">Контраст</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Качество экспорта: {Math.round(options.quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Кнопка скачивания */}
              <button
                onClick={downloadImage}
                disabled={!userImage}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Экспортировать результат
              </button>
            </div>

            {/* Превью */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                <Layers className="inline w-6 h-6 mr-2" />
                Превью композиции
              </h2>
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[600px]">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Преимущества библиотеки */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Возможности</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Множество готовых шаблонов</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Быстрая кастомизация стилей</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Поддержка фильтров и эффектов</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-600">Преимущества</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Минимум кода для интеграции</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Профессиональные результаты</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Регулярные обновления шаблонов</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-600">API методы</h3>
              <ul className="space-y-2 text-gray-700 text-sm font-mono">
                <li>.applyTemplate()</li>
                <li>.addFilter()</li>
                <li>.export()</li>
                <li>.addCustomElement()</li>
                <li>.batch()</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupLibraryPage;