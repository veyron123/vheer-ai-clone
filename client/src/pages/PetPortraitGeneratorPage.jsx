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
import MockupSection from '../components/common/MockupSection';
import ReviewsSection from '../components/common/ReviewsSection';
import TextReviewsSection from '../components/common/TextReviewsSection';

// Constants
import { PET_PORTRAIT_STYLES } from '../constants/petPortrait.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const PetPortraitGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('regal');
  const [customStyle, setCustomStyle] = useState('');
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
    generateImage,
    cancelGeneration
  } = useImageGeneration();

  const handleGenerate = () => {
    // Use custom style if provided, otherwise use selected style
    const finalStyle = customStyle.trim() ? 'custom' : selectedStyle;
    generateImage(finalStyle, aiModel, aspectRatio, customStyle.trim());
  };


  // Pet portrait specific example images
  const petExampleImages = [
    {
      id: 1,
      original: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=400&fit=crop',
      generated: '/pet-examples/regal-dog.jpg',
      style: 'Regal'
    },
    {
      id: 2,
      original: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=400&fit=crop',
      generated: '/pet-examples/astronaut-cat.jpg',
      style: 'Astronaut'
    },
    {
      id: 3,
      original: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=400&fit=crop',
      generated: '/pet-examples/wizard-dog.jpg',
      style: 'Wizard'
    }
  ];

  return (
    <>
      <SEO 
        title="AI Pet Portrait Generator - Transform Pet Photos to Themed Art"
        description="Create amazing themed portraits of your pets! Transform dogs and cats into regal, military, wizard, astronaut and other fun styles using advanced AI technology."
        keywords="pet portrait generator, AI pet art, dog portrait generator, cat portrait generator, pet costume AI, animal portrait creator, themed pet photos"
        url="https://vheer.ai/pet-portrait-generator"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">AI Pet Portrait Generator</span>
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
                aspectRatio={aspectRatio}
                aiModel={aiModel}
                autoShowMockup={true}
              />
            </div>
            
            {/* Show examples only when no images are loaded */}
            {!generatedImage && !uploadedImage && <ExampleGallery examples={petExampleImages} />}
            
            {/* Mockup Generator Section - replaces examples when image is loaded */}
            {(generatedImage || uploadedImage) && (
              <MockupSection
                imageUrl={generatedImage || uploadedImage}
                aspectRatio={aspectRatio}
                aiModel={aiModel}
                autoShow={true}
              />
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="order-1 lg:order-2 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-20">
            <StyleSelector 
              styles={PET_PORTRAIT_STYLES}
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
              disabled={aiModel === 'nano-banana'}
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

    {/* Reviews Section */}
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <ReviewsSection />
      </div>
    </div>
    
    {/* Detailed Text Reviews */}
    <div className="container mx-auto px-4 pb-12">
      <TextReviewsSection />
    </div>

    </>
  );
};

export default PetPortraitGeneratorPage;