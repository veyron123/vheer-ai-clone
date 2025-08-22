import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Frame } from 'lucide-react';

// Components
import ImageToImageUploader from '../components/image-to-image/ImageToImageUploader';
import PromptControls from '../components/image-to-image/PromptControls';
import ImageModelSelector from '../components/image-to-image/ImageModelSelector';
import ImageAspectRatioSelector from '../components/image-to-image/ImageAspectRatioSelector';
import ImageGenerateButton from '../components/image-to-image/ImageGenerateButton';
import ImageExampleGallery from '../components/image-to-image/ImageExampleGallery';
import MockupGenerator from '../components/image-to-image/MockupGenerator';
import SEO from '../components/SEO';

// Hooks
import { useImageToImageGeneration } from '../hooks/useImageToImageGeneration';

const ImageToImageGeneratorPage = () => {
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('match');
  const [showMockupGenerator, setShowMockupGenerator] = useState(false);
  
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
        title="AI Image to Image Generator - Transform Photos with AI Magic"
        description="Reimagine any photo with AI magic. Keep facial features intact while exploring endless creative possibilities. Use Flux Pro, Flux Max, and Chat GPT Image models."
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
                />
              </div>
              
              <ImageExampleGallery />
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              {/* Prompt Controls */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <PromptControls
                  positivePrompt={positivePrompt}
                  negativePrompt={negativePrompt}
                  creativeStrength={creativeStrength}
                  controlStrength={controlStrength}
                  onPositivePromptChange={setPositivePrompt}
                  onNegativePromptChange={setNegativePrompt}
                  onCreativeStrengthChange={setCreativeStrength}
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
                  disabled={aiModel !== 'gpt-image' && aiModel !== 'midjourney' && aiModel !== 'qwen-image'}
                />
                
                <ImageGenerateButton
                  onClick={handleGenerate}
                  disabled={!uploadedImage}
                  isGenerating={isGenerating}
                  onClear={clearAll}
                  aiModel={aiModel}
                />

                {/* Кнопка создания мокапа */}
                {canShowMockupButton() && (
                  <button
                    onClick={() => setShowMockupGenerator(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                  >
                    <Frame className="w-5 h-5" />
                    Создать мокап
                  </button>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с генератором мокапов */}
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

export default ImageToImageGeneratorPage;