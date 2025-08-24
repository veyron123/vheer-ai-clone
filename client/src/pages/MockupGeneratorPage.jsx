import React, { useState, useRef } from 'react';
import { Frame, Upload, Download, RotateCw, Move, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MockupGenerator from '../components/image-to-image/MockupGenerator';

const MockupGeneratorPage = () => {
  const { t } = useTranslation('common');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showMockupGenerator, setShowMockupGenerator] = useState(false);
  const fileInputRef = useRef(null);

  // Пример изображений для демонстрации
  const exampleImages = [
    {
      url: 'https://picsum.photos/400/400?random=1',
      ratio: '1:1',
      title: 'Квадратное изображение 1:1'
    },
    {
      url: 'https://picsum.photos/640/480?random=2', 
      ratio: '4:3',
      title: 'Пейзажное изображение 4:3'
    },
    {
      url: 'https://picsum.photos/400/400?random=3',
      ratio: '1:1', 
      title: 'Квадратное изображение 1:1'
    }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        setSelectedImage(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExampleSelect = (example) => {
    setImageUrl(example.url);
    setAspectRatio(example.ratio);
    setSelectedImage(example.title);
  };

  const canCreateMockup = imageUrl && (aspectRatio === '1:1' || aspectRatio === '4:3');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4">
              <Frame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Генератор мокапов
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Превратите ваши изображения в профессиональные презентации с красивыми рамками
            </p>
          </div>

          {/* Основной контент */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Загрузка изображения */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Выберите изображение
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Загрузка файла */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Загрузить файл
                  </h3>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Нажмите для выбора изображения
                    </p>
                    <p className="text-sm text-gray-500">
                      Поддерживаются: PNG, JPG, WEBP
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Примеры */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Или выберите пример
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {exampleImages.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleSelect(example)}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mr-3 flex items-center justify-center">
                          <Frame className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{example.title}</p>
                          <p className="text-sm text-gray-500">Соотношение {example.ratio}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Выбранное изображение */}
            {selectedImage && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Выбранное изображение: {selectedImage}
                </h3>
                
                {/* Превью изображения */}
                {imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-xs max-h-48 rounded-lg shadow-md"
                    />
                  </div>
                )}

                {/* Настройки соотношения */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Соотношение сторон рамки
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAspectRatio('1:1')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        aspectRatio === '1:1'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      1:1 (Квадрат)
                    </button>
                    <button
                      onClick={() => setAspectRatio('4:3')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        aspectRatio === '4:3'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      4:3 (Пейзаж)
                    </button>
                  </div>
                </div>

                {/* Кнопка создания мокапа */}
                <button
                  onClick={() => setShowMockupGenerator(true)}
                  disabled={!canCreateMockup}
                  className={`
                    w-full px-6 py-3 rounded-xl font-medium text-white transition-all
                    flex items-center justify-center gap-3
                    ${canCreateMockup
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Frame className="w-5 h-5" />
                  Создать мокап
                </button>
              </div>
            )}

            {/* Информация о возможностях */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Что вы сможете делать с мокапами:
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <RotateCw className="w-6 h-6 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Поворот</h4>
                    <p className="text-sm text-gray-600">Поворачивайте изображение от -180° до +180°</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Maximize className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Масштаб</h4>
                    <p className="text-sm text-gray-600">Изменяйте размер от 50% до 200%</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Move className="w-6 h-6 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Позиция</h4>
                    <p className="text-sm text-gray-600">Точно позиционируйте изображение</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Примеры готовых мокапов */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Примеры готовых мокапов
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Frame className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900">Пример мокапа {i}</h3>
                    <p className="text-sm text-gray-500">Профессиональная презентация</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Компонент генератора мокапов */}
      {showMockupGenerator && (
        <MockupGenerator
          imageUrl={imageUrl}
          aspectRatio={aspectRatio}
          onClose={() => setShowMockupGenerator(false)}
        />
      )}
    </div>
  );
};

export default MockupGeneratorPage;