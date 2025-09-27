import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Components
import ImageUploader from '../components/halloween/ImageUploader';
import StyleSelector from '../components/halloween/StyleSelector';
import ModelSelector from '../components/halloween/ModelSelector';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/halloween/GenerateButton';
import ExampleGallery from '../components/anime/ExampleGallery';
import SEO from '../components/SEO';
import MockupSection from '../components/common/MockupSection';
import ReviewsSection from '../components/common/ReviewsSection';
import TextReviewsSection from '../components/common/TextReviewsSection';

// Constants
import { HALLOWEEN_STYLES } from '../constants/halloween.constants';
import { TEXT_TO_IMAGE_ASPECT_RATIOS } from '../constants/textToImage.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const HalloweenPortraitGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('corpse-bride');
  const [customStyle, setCustomStyle] = useState('');
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('match');

  // Force dark mode for Halloween theme
  useEffect(() => {
    const htmlElement = document.documentElement;
    const originalClass = htmlElement.className;
    
    // Add dark class for Halloween theme
    htmlElement.classList.add('dark');
    
    // Cleanup on unmount - restore original theme
    return () => {
      htmlElement.className = originalClass;
    };
  }, []);
  
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


  return (
    <>
      <SEO 
        title="AI Halloween Portrait Generator - Spooky Photo Transformations"
        description="Transform your photos into haunting Halloween portraits with AI. Create spooky, ghostly, vampire, witch, and monster-themed artwork instantly with advanced AI models."
        keywords="halloween generator, spooky photos, halloween AI, vampire portrait, ghost portrait, witch transformation, monster maker, halloween art, scary photo filter"
        url="https://vheer.ai/halloween-portraits"
      />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-gray-50 to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-black">
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            Halloween Portraits
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-4 sm:py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-4 sm:gap-8">

          {/* Left Column - Upload and Examples - только на десктопе */}
          <div className="hidden lg:block order-2 lg:order-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
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
            {!generatedImage && !uploadedImage && <ExampleGallery />}

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

          {/* Right Column - Settings - только на десктопе */}
          <div className="hidden lg:block order-1 lg:order-2 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-20">

            <StyleSelector
              styles={HALLOWEEN_STYLES}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
              isPetPortrait={true}
            />

            <ModelSelector
              selectedModel={aiModel}
              onModelChange={setAiModel}
            />


            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
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

        {/* ImageUploader и вся секция настроек - на мобильных и планшетах */}
        <div className="block md:hidden space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
            <StyleSelector
              styles={HALLOWEEN_STYLES}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
              isPetPortrait={true}
            />

            <ModelSelector
              selectedModel={aiModel}
              onModelChange={setAiModel}
            />


            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              aiModel={aiModel}
            />


            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage}
              isGenerating={isGenerating}
              aiModel={aiModel}
            />
          </div>

          {/* Mockup Section - после настроек на мобильных */}
          {(generatedImage || uploadedImage) && (
            <MockupSection
              imageUrl={generatedImage || uploadedImage}
              aspectRatio={aspectRatio}
              aiModel={aiModel}
              autoShow={true}
            />
          )}
        </div>
      </div>

    </div>


    {/* Reviews Section */}
    <div className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <ReviewsSection />
      </div>
    </div>
    
    {/* Detailed Text Reviews */}
    <div className="container mx-auto px-4 pb-12 dark:bg-gray-900">
      <TextReviewsSection />
    </div>

    {/* Halloween fog/mist at bottom */}
    <div className="relative">
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-800/30 via-gray-600/20 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-purple-900/20 via-orange-800/10 to-transparent pointer-events-none"></div>
    </div>

    </>
  );
};

export default HalloweenPortraitGeneratorPage;
