import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Components
import ImageToImageUploader from '../components/image-to-image/ImageToImageUploader';
import PromptControls from '../components/image-to-image/PromptControls';
import ImageModelSelector from '../components/image-to-image/ImageModelSelector';
import ImageAspectRatioSelector from '../components/image-to-image/ImageAspectRatioSelector';
import ImageGenerateButton from '../components/image-to-image/ImageGenerateButton';
import ImageExampleGallery from '../components/image-to-image/ImageExampleGallery';
import SEO from '../components/SEO';
import MockupSection from '../components/common/MockupSection';
import ReviewsSection from '../components/common/ReviewsSection';
import TextReviewsSection from '../components/common/TextReviewsSection';

// Hooks
import { useImageToImageGeneration } from '../hooks/useImageToImageGeneration';

const ImageToImageGeneratorPage = () => {
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('match');
  
  const {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    positivePrompt,
    negativePrompt,
    creativeStrength,
    controlStrength,
    fileInputRef,
    setPositivePrompt,
    setNegativePrompt,
    setCreativeStrength,
    setControlStrength,
    handleImageUpload,
    handleImageRemove,
    generateImage,
    cancelGeneration,
    handlePaste,
    clearAll
  } = useImageToImageGeneration();

  const handleGenerate = () => {
    generateImage(aiModel, aspectRatio);
  };


  return (
    <>
      <SEO 
        title="AI Image to Image Generator - Transform Photos with AI Magic"
        description="Reimagine any photo with AI magic. Keep facial features intact while exploring endless creative possibilities. Use Flux Pro, Flux Max, and GPT Image models."
        keywords="image to image generator, AI image transformation, photo editor AI, style transfer, image variation generator, AI photo enhancer"
        url="https://colibrrri.com/image-to-image-generator"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-custom py-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <Link to="/" className="hover:text-primary-600">Home</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 font-medium">AI Image to Image Generator</span>
            </div>

            {/* Title and Description */}
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  AI Image to Image Generator
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full">
                  AI
                </span>
              </div>
              <p className="text-lg text-gray-600">
                Reimagine any photo with AI magic. Keep facial features intact while exploring endless creative possibilities.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-[1fr,380px] gap-8">
            
            {/* Left Column - Upload and Examples */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <ImageToImageUploader
                  uploadedImage={uploadedImage}
                  generatedImage={generatedImage}
                  generationTime={generationTime}
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                  onCancel={cancelGeneration}
                  onPaste={handlePaste}
                  fileInputRef={fileInputRef}
                  isGenerating={isGenerating}
                  aspectRatio={aspectRatio}
                  aiModel={aiModel}
                  autoShowMockup={true}
                />
              </div>
              
              {/* Show examples only when no images are loaded */}
              {!generatedImage && !uploadedImage && <ImageExampleGallery />}
              
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
            <div className="space-y-6">
              {/* Prompt Controls */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <PromptControls
                  positivePrompt={positivePrompt}
                  onPositivePromptChange={setPositivePrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={setNegativePrompt}
                  creativeStrength={creativeStrength}
                  onCreativeStrengthChange={setCreativeStrength}
                  controlStrength={controlStrength}
                  onControlStrengthChange={setControlStrength}
                />
              </div>

              {/* Model and Settings */}
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
                <ImageModelSelector
                  selectedModel={aiModel}
                  onModelChange={setAiModel}
                />
                
                <ImageAspectRatioSelector
                  selectedRatio={aspectRatio}
                  onRatioChange={setAspectRatio}
                  disabled={aiModel === 'nano-banana'}
                />
                
                <ImageGenerateButton
                  onClick={handleGenerate}
                  disabled={!uploadedImage}
                  isGenerating={isGenerating}
                  onClear={clearAll}
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

export default ImageToImageGeneratorPage;