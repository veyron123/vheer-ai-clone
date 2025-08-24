import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';

// Components
import PromptInput from '../components/text-to-image/PromptInput';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/anime/GenerateButton';
import TextToImageResult from '../components/text-to-image/TextToImageResult';
import AdvancedSettings from '../components/text-to-image/AdvancedSettings.jsx';
import MockupSection from '../components/common/MockupSection';
import SEO from '../components/SEO';

// Constants
import { TEXT_TO_IMAGE_ASPECT_RATIOS, DEFAULT_ADVANCED_SETTINGS } from '../constants/textToImage.constants';

// Hooks
import { useTextToImageGeneration } from '../hooks/useTextToImageGeneration';

const TextToImageGeneratorPage = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [baseImage, setBaseImage] = useState(null);
  const [isImageToImage, setIsImageToImage] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(DEFAULT_ADVANCED_SETTINGS);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const {
    generatedImages,
    generatedImage,
    isGenerating,
    generationTime,
    generateImage,
    cancelGeneration,
    clearImage
  } = useTextToImageGeneration();

  const handleGenerate = () => {
    // Using Qwen Image model by default - передаем пустой негативный промт 
    generateImage(prompt, 'qwen-image', aspectRatio, baseImage, advancedSettings);
  };

  const handleUseAsBase = (imageUrl) => {
    const targetImage = imageUrl || generatedImage || (generatedImages && generatedImages[0]);
    if (targetImage) {
      setBaseImage(targetImage.url || targetImage);
      setIsImageToImage(true);
    }
  };

  const handleClearBase = () => {
    setBaseImage(null);
    setIsImageToImage(false);
  };

  return (
    <>
      <SEO 
        title="AI Text To Image Generator - Create Images from Text"
        description="Generate stunning images from text descriptions using advanced AI models. Create artwork, concepts, and visuals instantly with GPT Image and Qwen Image generators."
        keywords="text to image, AI image generator, text to art, AI art creator, image generation from text, GPT image, Qwen image"
        url="https://vheer.ai/text-to-image-generator"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Breadcrumb */}
        <div className="container-custom py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">AI Text To Image Generator</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container-custom py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Text To Image Generator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create stunning images from your text descriptions using advanced AI technology. 
              Just describe what you want to see and let AI bring it to life.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-[1fr,380px] gap-8 lg:items-stretch">
            
            {/* Left Column - Image Display */}
            <div className="order-2 lg:order-1">
              <TextToImageResult
                generatedImages={generatedImages}
                generatedImage={generatedImage}
                isGenerating={isGenerating}
                generationTime={generationTime}
                onCancel={cancelGeneration}
                onClear={clearImage}
                onUseAsBase={handleUseAsBase}
                isBaseImageActive={isImageToImage}
              />
            </div>

            {/* Right Column - Controls */}
            <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full">
              
              {/* Mode Indicator */}
              {isImageToImage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-700">
                      <Layers className="w-5 h-5 mr-2" />
                      <span className="font-medium">Image-to-Image Mode</span>
                    </div>
                    <button
                      onClick={handleClearBase}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Clear base
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Your next generation will modify the current image
                  </p>
                </div>
              )}
              
              {/* Prompt Input */}
              <div>
                <PromptInput 
                  prompt={prompt}
                  onPromptChange={setPrompt}
                />
              </div>

              <div className="border-t pt-6 mt-6 space-y-6">
                {/* Number of Images */}
                <div>
                  <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Number of Images
                    </label>
                    <div className="ml-2 w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help relative group">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-50 max-w-xs hidden group-hover:block">
                        How many images to generate at once. Note: Credits are charged per image
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <label key={num} className="cursor-pointer">
                        <input
                          type="radio"
                          name="numImages"
                          value={num}
                          checked={advancedSettings.numImages === num}
                          onChange={() => setAdvancedSettings({...advancedSettings, numImages: num})}
                          className="sr-only"
                        />
                        <div className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors text-center ${
                          advancedSettings.numImages === num
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}>
                          {num}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <AspectRatioSelector
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  aspectRatios={TEXT_TO_IMAGE_ASPECT_RATIOS}
                />
              </div>
              
              {/* Spacer to push Generate button to bottom */}
              <div className="flex-grow"></div>
              
              {/* Advanced Settings */}
              <AdvancedSettings
                settings={advancedSettings}
                onSettingsChange={setAdvancedSettings}
                isVisible={showAdvancedSettings}
                onToggleVisibility={() => setShowAdvancedSettings(!showAdvancedSettings)}
              />
              
              <div className="border-t pt-6 mt-6">
                <GenerateButton
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  isGenerating={isGenerating}
                  aiModel="qwen-image"
                  numImages={advancedSettings.numImages}
                />
              </div>


            </div>
          </div>
          
          {/* Mockup Generator Section */}
          <MockupSection
            imageUrl={generatedImage || (generatedImages && generatedImages[0] && (generatedImages[0].url || generatedImages[0]))}
            aspectRatio={aspectRatio}
            aiModel="qwen-image"
            autoShow={true}
          />

          {/* Tips Section */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Tips for Better Results
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• Be specific and descriptive in your prompts</li>
              <li>• Include style keywords like "photorealistic", "digital art", "oil painting"</li>
              <li>• Mention lighting, colors, and mood for better results</li>
              <li>• Use English prompts for optimal performance</li>
              <li>• Try the random prompt button for inspiration</li>
            </ul>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default TextToImageGeneratorPage;