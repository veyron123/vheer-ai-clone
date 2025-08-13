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

// Constants
import { ANIME_STYLES } from '../constants/anime.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const AnimeGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('disney');
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('match');
  
  const {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateImage
  } = useImageGeneration();

  const handleGenerate = () => {
    generateImage(selectedStyle, aiModel, aspectRatio);
  };

  return (
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
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          
          {/* Left Column - Upload and Examples */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <ImageUploader
                uploadedImage={uploadedImage}
                generatedImage={generatedImage}
                generationTime={generationTime}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                fileInputRef={fileInputRef}
              />
            </div>
            
            <ExampleGallery />
          </div>

          {/* Right Column - Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
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
            />
            
            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage}
              isGenerating={isGenerating}
            />
            
            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center">
                <span className="mr-1">🎨</span> Unlimited & Free
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Powered by Vheer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeGeneratorPage;