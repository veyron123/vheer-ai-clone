import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Components
import ImageUploader from '../components/anime/ImageUploader';
import StyleSelector from '../components/anime/StyleSelector';
import ModelSelector from '../components/anime/ModelSelector';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/anime/GenerateButton';
import ExampleGallery from '../components/anime/ExampleGallery';
import SEO from '../components/SEO';

// Constants
import { ANIME_STYLES } from '../constants/anime.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const AnimeGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('studio-ghibli');
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
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
    generateImage(selectedStyle, aiModel, aspectRatio);
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
            />
            
            <ModelSelector
              selectedModel={aiModel}
              onModelChange={setAiModel}
            />
            
            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              disabled={aiModel !== 'gpt-image'}
              aiModel={aiModel}
            />
            
            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage}
              isGenerating={isGenerating}
              aiModel={aiModel}
            />
            
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AnimeGeneratorPage;