import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Components
import ImageUploader from '../components/anime/ImageUploader';
import StyleSelector from '../components/anime/StyleSelector';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/anime/GenerateButton';
import ExampleGallery from '../components/anime/ExampleGallery';
import SEO from '../components/SEO';
import MockupSection from '../components/common/MockupSection';

// Constants
import { ACTION_FIGURE_STYLES } from '../constants/actionFigure.constants';

// Hooks
import { useActionFigureGeneration } from '../hooks/useActionFigureGeneration';

const ActionFigureGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('superhero-classic');
  const [customStyle, setCustomStyle] = useState('');
  // Using Nano-Banana model for Action Figure generation (best for style transfer)
  const aiModel = 'nano-banana';
  const [aspectRatio, setAspectRatio] = useState('3:4');
  
  const {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateActionFigureImage,
    cancelGeneration
  } = useActionFigureGeneration();

  const handleGenerate = () => {
    if (customStyle.trim()) {
      // For custom style, use traditional approach
      alert('Custom styles not supported yet for Action Figure Generator. Please select a predefined style.');
      return;
    }
    
    // Find the selected style data
    const styleData = ACTION_FIGURE_STYLES.find(style => style.id === selectedStyle);
    if (!styleData) {
      alert('Please select a valid action figure style');
      return;
    }
    
    // Generate action figure with style image
    generateActionFigureImage(selectedStyle, styleData, aiModel, aspectRatio);
  };

  // Action figure specific example images
  const actionFigureExampleImages = [
    {
      id: 1,
      original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      generated: '/example-results/action-figure-example-1.webp',
      style: 'Superhero Action Figure'
    },
    {
      id: 2,
      original: 'https://images.unsplash.com/photo-1494790108755-2616b612b851?w=300&h=400&fit=crop',
      generated: '/example-results/action-figure-example-2.webp',
      style: 'Anime Action Figure'
    },
    {
      id: 3,
      original: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop',
      generated: '/example-results/action-figure-example-3.webp',
      style: 'Robot Mech Figure'
    }
  ];

  return (
    <>
      <SEO 
        title="AI Photo to Action Figure Generator - Transform Photos into Collectible Figures"
        description="Transform any photo into an amazing action figure! Create superhero, anime, robot, fantasy and other collectible action figures using advanced AI technology."
        keywords="action figure generator, photo to action figure, AI toy generator, superhero figure creator, anime figure generator, collectible maker, custom action figures"
        url="https://vheer.ai/photo-to-action-figure"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center text-lg text-gray-600">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Photo to Action Figure Generator</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container-custom py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Photo to Action Figure Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your photos into amazing collectible action figures! Choose from superhero, anime, fantasy, and many more styles.
          </p>
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
                aiModel={'nano-banana'}
                autoShowMockup={true}
              />
            </div>
            
            {/* Show examples only when no images are loaded */}
            {!generatedImage && !uploadedImage && <ExampleGallery examples={actionFigureExampleImages} />}
            
            {/* Mockup Generator Section - replaces examples when image is loaded */}
            {(generatedImage || uploadedImage) && (
              <MockupSection
                imageUrl={generatedImage || uploadedImage}
                aspectRatio={aspectRatio}
                aiModel={'nano-banana'}
                autoShow={true}
              />
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="order-1 lg:order-2 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-20">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Action Figure Style</h3>
              <p className="text-sm text-gray-600 mb-4">Choose from our collection of action figure styles</p>
            </div>
            
            <StyleSelector 
              styles={ACTION_FIGURE_STYLES}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              customStyle={customStyle}
              onCustomStyleChange={setCustomStyle}
              isActionFigure={true}
            />
            
            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              disabled={false}
              aiModel={'nano-banana'}
            />
            
            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage}
              isGenerating={isGenerating}
              aiModel={'nano-banana'}
            />
            
            {/* Feature Highlights */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">✨ Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 20+ action figure styles</li>
                <li>• Superhero, anime, fantasy themes</li>
                <li>• High-quality collectible look</li>
                <li>• Perfect for social media</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>

    {/* How It Works Section */}
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Photo</h3>
            <p className="text-gray-600">Upload any portrait photo you want to transform</p>
          </div>
          <div className="text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎭</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Choose Style</h3>
            <p className="text-gray-600">Select from 20+ action figure styles and themes</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Your Figure</h3>
            <p className="text-gray-600">Download your custom action figure in seconds!</p>
          </div>
        </div>
      </div>
    </div>

    </>
  );
};

export default ActionFigureGeneratorPage;