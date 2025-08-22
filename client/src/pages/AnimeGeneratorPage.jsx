import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Frame } from 'lucide-react';

// Components
import ImageUploader from '../components/anime/ImageUploader';
import StyleSelector from '../components/anime/StyleSelector';
import ModelSelector from '../components/anime/ModelSelector';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/anime/GenerateButton';
import ExampleGallery from '../components/anime/ExampleGallery';
import MockupGenerator from '../components/image-to-image/MockupGenerator';
import SEO from '../components/SEO';

// Constants
import { ANIME_STYLES } from '../constants/anime.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const AnimeGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('disney');
  const [customStyle, setCustomStyle] = useState('');
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showMockupGenerator, setShowMockupGenerator] = useState(false);
  
  const {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateImage,
    cancelGeneration
  } = useImageGeneration();

  const handleGenerate = () => {
    // Use custom style if provided, otherwise use selected style
    const finalStyle = customStyle.trim() ? 'custom' : selectedStyle;
    generateImage(finalStyle, aiModel, aspectRatio, customStyle.trim());
  };

  // Проверяем условия для показа кнопки мокапа
  const canShowMockupButton = () => {
    return (
      generatedImage &&
      (aiModel === 'gpt-image' || aiModel === 'qwen-image') &&
      (aspectRatio === '1:1' || aspectRatio === '4:3')
    );
  };

  return (
    <>
      <SEO 
        title="AI Anime Generator - Transform Photos to Anime Art"
        description="Convert your photos into stunning anime, Disney, Pixar, and manga styles instantly. Use advanced AI models including Flux Pro, Flux Max, and GPT Image for amazing results."
        keywords="anime generator, photo to anime, AI anime converter, Disney style generator, Pixar filter, manga creator, cartoon filter, anime art AI"
        url="https://vheer.ai/anime-generator"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">AI Anime Portrait</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-4 sm:py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-4 sm:gap-8">
          
          {/* Left Column - Upload and Examples */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <ImageUploader
                uploadedImage={uploadedImage}
                generatedImage={generatedImage}
                generationTime={generationTime}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                onCancel={cancelGeneration}
                fileInputRef={fileInputRef}
                isGenerating={isGenerating}
              />
            </div>
            
            <ExampleGallery />
          </div>

          {/* Right Column - Settings */}
          <div className="order-1 lg:order-2 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-20">
            <StyleSelector 
              styles={ANIME_STYLES}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
            />
            
            <ModelSelector
              selectedModel={aiModel}
              onModelChange={setAiModel}
            />
            
            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              disabled={aiModel !== 'gpt-image' && aiModel !== 'qwen-image'}
              aiModel={aiModel}
            />
            
            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage}
              isGenerating={isGenerating}
              aiModel={aiModel}
            />
            
            {/* Кнопка создания мокапа */}
            {canShowMockupButton() && (
              <div className="mt-4">
                <button
                  onClick={() => setShowMockupGenerator(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                  <Frame className="w-5 h-5" />
                  Создать мокап
                </button>
              </div>
            )}
            
            
          </div>
        </div>
      </div>
    </div>

    {/* Модальное окно мокапа */}
    {showMockupGenerator && (
      <MockupGenerator
        imageUrl={generatedImage}
        aspectRatio={aspectRatio}
        onClose={() => setShowMockupGenerator(false)}
      />
    )}
    </>
  );
};

export default AnimeGeneratorPage;