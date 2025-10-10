import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Components
import ImageUploader from '../components/anime/ImageUploader';
import AspectRatioSelector from '../components/anime/AspectRatioSelector';
import GenerateButton from '../components/anime/GenerateButton';
import ExampleGallery from '../components/anime/ExampleGallery';
import SEO from '../components/SEO';
import MockupSection from '../components/common/MockupSection';
import ReviewsSection from '../components/common/ReviewsSection';
import TextReviewsSection from '../components/common/TextReviewsSection';

// Constants
import { ACTION_FIGURE_STYLES } from '../constants/actionFigure.constants';

// Hooks
import { useActionFigureGeneration } from '../hooks/useActionFigureGeneration';

const ActionFigureGeneratorPage = () => {
  const [figureName, setFigureName] = useState('');
  const [figureItems, setFigureItems] = useState('');
  // Using Nano-Banana model for Action Figure generation (best for style transfer)
  const aiModel = 'nano-banana';
  const [aspectRatio, setAspectRatio] = useState('3:4');
  
  const {
    uploadedImage,
    generatedImage,
    generatedImages,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateActionFigureImage,
    cancelGeneration
  } = useActionFigureGeneration();

  const handleGenerate = () => {
    if (!figureName.trim()) {
      alert('Please enter a name for the action figure');
      return;
    }

    if (!figureItems.trim()) {
      alert('Please enter items/accessories for the action figure');
      return;
    }

    // Create custom style data for the action figure
    const customStyleData = {
      id: 'custom',
      name: figureName,
      image: '/example-results/idyXE20dVrPCQE62CUUxJ.jpeg' // Default style reference image
    };

    // Generate action figure with custom name and items
    generateActionFigureImage(figureName, figureItems, customStyleData, aiModel, aspectRatio);
  };

  // Action figure specific example images
   const actionFigureExampleImages = [
     {
       id: 1,
       original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
       generated: '/example-results/idyXE20dVrPCQE62CUUxJ.jpeg',
       style: 'Action Figure Style'
     },
     {
       id: 2,
       original: 'https://images.unsplash.com/photo-1494790108755-2616b612b851?w=300&h=400&fit=crop',
       generated: '/example-results/output.jpeg',
       style: 'Action Figure Style'
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


      {/* Main Content */}
      <div className="container-custom py-4 sm:py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-4 sm:gap-8">

          {/* Left Column - Upload and Examples - только на десктопе */}
          <div className="hidden lg:block order-2 lg:order-1">
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

            {/* Show examples only when no generated images exist */}
            {(!generatedImage && !(generatedImages && generatedImages[0])) && <ExampleGallery examples={actionFigureExampleImages} />}

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

          {/* Right Column - Settings - только на десктопе */}
          <div className="hidden lg:block order-1 lg:order-2 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-20">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Name or title on the packaging:</h3>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={figureName}
                onChange={(e) => setFigureName(e.target.value)}
                placeholder="Enter name for the packaging..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Items Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profession & Items
              </label>
              <textarea
                value={figureItems}
                onChange={(e) => setFigureItems(e.target.value)}
                placeholder="Enter profession and items for the figure (e.g., doctor with stethoscope, teacher with books, etc.)..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              disabled={false}
              aiModel={'nano-banana'}
            />

            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage || !figureName.trim() || !figureItems.trim()}
              isGenerating={isGenerating}
              aiModel={'nano-banana'}
            />
          </div>
        </div>

        {/* ImageUploader и вся секция настроек - на мобильных и планшетах */}
        <div className="block lg:hidden space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
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

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Name or title on the packaging:</h3>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={figureName}
                onChange={(e) => setFigureName(e.target.value)}
                placeholder="Enter name for the packaging..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Items Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profession & Items
              </label>
              <textarea
                value={figureItems}
                onChange={(e) => setFigureItems(e.target.value)}
                placeholder="Enter profession and items for the figure (e.g., doctor with stethoscope, teacher with books, etc.)..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              disabled={false}
              aiModel={'nano-banana'}
            />

            <GenerateButton
              onClick={handleGenerate}
              disabled={!uploadedImage || !figureName.trim() || !figureItems.trim()}
              isGenerating={isGenerating}
              aiModel={'nano-banana'}
            />
          </div>

          {/* Mockup Section - после настроек на мобильных */}
          {(generatedImage || uploadedImage) && (
            <MockupSection
              imageUrl={generatedImage || uploadedImage}
              aspectRatio={aspectRatio}
              aiModel={'nano-banana'}
              autoShow={true}
            />
          )}
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
            <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
            <p className="text-gray-600">Advanced AI transforms your photo into action figure</p>
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

export default ActionFigureGeneratorPage;
