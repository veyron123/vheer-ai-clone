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
import MockupSection from '../components/common/MockupSection';
import ReviewsSection from '../components/common/ReviewsSection';
import TextReviewsSection from '../components/common/TextReviewsSection';
import SEO from '../components/SEO';
import CreditDisplay from '../components/CreditDisplay';

// Constants
import { STYLE_TRANSFER_STYLES, STYLE_TRANSFER_AI_MODELS } from '../constants/styleTransfer.constants';

// Hooks
import { useImageGeneration } from '../hooks/useImageGeneration';

const StyleTransferPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('studio-ghibli');
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

  return (
    <>
      <SEO 
        title="AI Style Transfer - Transform Photos with Artistic Styles"
        description="Apply stunning artistic styles to your photos using advanced AI. Transform images with anime, Disney, Pixar, and more creative styles instantly."
        keywords="style transfer, AI art generator, photo style changer, artistic filter, anime style, Disney style, Pixar style, AI photo transformation"
        url="https://vheer.ai/generate"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">AI Style Transfer</span>
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

          {/* Right Column - Settings */}
          <div className="space-y-4">
            {/* Credit Display */}
            <CreditDisplay />
            
            <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
              <StyleSelector 
              styles={STYLE_TRANSFER_STYLES}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
            />
            
            <div className="mb-6">
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">AI Model</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {Object.values(STYLE_TRANSFER_AI_MODELS).map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setAiModel(model.id)}
                    className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      aiModel === model.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {model.name}
                    <span className={`absolute -top-3 -right-2 ${model.badge.color} text-sm px-2 py-0.5 rounded-full font-bold`}>
                      {model.badge.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
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

export default StyleTransferPage;