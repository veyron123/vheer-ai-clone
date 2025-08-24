import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Video, 
  Image as ImageIcon, 
  Settings, 
  Zap,
  Clock,
  CreditCard,
  Info,
  Sparkles,
  Upload,
  ChevronRight
} from 'lucide-react';
import { useRunwayVideoGeneration } from '../hooks/useRunwayVideoGeneration';
import { RUNWAY_VIDEO_CONSTANTS } from '../constants/runwayVideo.constants';
import BaseImageUploader from '../components/common/BaseImageUploader';
import UniversalGenerateButton from '../components/common/UniversalGenerateButton';
import VideoResultDisplay from '../components/common/VideoResultDisplay';
import PricingDisplay from '../components/ui/PricingDisplay';
import SEO from '../components/SEO';
import { toast } from 'react-hot-toast';

const RunwayVideoGeneratorPage = () => {
  const { t } = useTranslation();
  const {
    isGenerating,
    generatedVideo,
    generationProgress,
    taskId,
    userCredits,
    options,
    generateVideo,
    fetchOptions,
    calculateCredits,
    validateParams,
    getEstimatedTime,
    reset
  } = useRunwayVideoGeneration();

  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    imageUrl: '',
    duration: RUNWAY_VIDEO_CONSTANTS.DEFAULTS.DURATION,
    quality: RUNWAY_VIDEO_CONSTANTS.DEFAULTS.QUALITY,
    aspectRatio: RUNWAY_VIDEO_CONSTANTS.DEFAULTS.ASPECT_RATIO,
    waterMark: RUNWAY_VIDEO_CONSTANTS.DEFAULTS.WATERMARK
  });

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedExample, setSelectedExample] = useState(null);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };

  const handleExampleSelect = (prompt) => {
    setFormData(prev => ({
      ...prev,
      prompt
    }));
    setShowExamples(false);
    toast.success('Example prompt applied!');
  };

  const handleGenerate = async () => {
    // Validate form
    if (!formData.prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    if (formData.prompt.length < RUNWAY_VIDEO_CONSTANTS.LIMITS.PROMPT_MIN_LENGTH) {
      toast.error(`Description must be at least ${RUNWAY_VIDEO_CONSTANTS.LIMITS.PROMPT_MIN_LENGTH} characters`);
      return;
    }

    const validation = validateParams(formData.duration, formData.quality);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const requiredCredits = calculateCredits(formData.duration, formData.quality);
    if (userCredits < requiredCredits) {
      toast.error(`Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits}`);
      return;
    }

    // Generate video
    const result = await generateVideo(formData);
    
    if (result) {
      console.log('Video generation started:', result);
    }
  };

  const requiredCredits = calculateCredits(formData.duration, formData.quality);
  const estimatedTime = getEstimatedTime(formData.duration, formData.quality);
  const paramValidation = validateParams(formData.duration, formData.quality);

  return (
    <>
      <SEO 
        title="AI Video Generator - Create Videos from Text or Images"
        description="Generate stunning AI videos from text descriptions or images using advanced Runway AI technology. Create professional videos with customizable duration, quality, and aspect ratios."
        keywords="AI video generator, text to video, image to video, Runway AI, video creation, AI animation"
        url="https://vheer.ai/video-generator"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Breadcrumb */}
        <div className="container-custom py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">AI Video Generator</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-custom py-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  AI Video Generator
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                  AI
                </span>
              </div>
              <p className="text-lg text-gray-600">
                Create stunning AI-generated videos from text descriptions or images using advanced Runway AI technology.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-[1fr,380px] gap-8">
            {/* Left Column - Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                {/* Prompt Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video className="w-4 h-4 inline mr-2" />
                    Video Description
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      placeholder="Describe the video you want to create... Be specific about subjects, actions, and visual style."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      maxLength={RUNWAY_VIDEO_CONSTANTS.LIMITS.PROMPT_MAX_LENGTH}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {formData.prompt.length}/{RUNWAY_VIDEO_CONSTANTS.LIMITS.PROMPT_MAX_LENGTH}
                    </div>
                  </div>
                  
                  {/* Example Prompts Button */}
                  <div className="mt-2 flex justify-between items-center">
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      {showExamples ? 'Hide Examples' : 'Show Example Prompts'}
                    </button>
                    <div className="text-xs text-gray-500">
                      Minimum {RUNWAY_VIDEO_CONSTANTS.LIMITS.PROMPT_MIN_LENGTH} characters
                    </div>
                  </div>
                </div>

                {/* Example Prompts */}
                {showExamples && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    {formData.imageUrl ? (
                      <>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2 text-purple-600" />
                          Image-to-Video Prompts:
                        </h3>
                        <p className="text-sm text-purple-700 mb-3">
                          These prompts describe how to animate or modify your uploaded image.
                        </p>
                        <div className="space-y-3">
                          {RUNWAY_VIDEO_CONSTANTS.IMAGE_TO_VIDEO_PROMPTS.map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-medium text-purple-700 mb-2">{category.category}</h4>
                              <div className="grid gap-2">
                                {category.prompts.map((prompt, promptIdx) => (
                                  <button
                                    key={promptIdx}
                                    onClick={() => handleExampleSelect(prompt)}
                                    className="text-left p-2 bg-white rounded border hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                                  >
                                    {prompt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium text-gray-900 mb-3">Example Prompts by Category:</h3>
                        <div className="space-y-3">
                          {RUNWAY_VIDEO_CONSTANTS.EXAMPLE_PROMPTS.map((category, idx) => (
                            <div key={idx}>
                              <h4 className="font-medium text-purple-700 mb-2">{category.category}</h4>
                              <div className="grid gap-2">
                                {category.prompts.map((prompt, promptIdx) => (
                                  <button
                                    key={promptIdx}
                                    onClick={() => handleExampleSelect(prompt)}
                                    className="text-left p-2 bg-white rounded border hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                                  >
                                    {prompt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Image Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Reference Image (Optional)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload an image to animate or extend. The AI will create a video based on your image and prompt.
                  </p>
                  
                  <BaseImageUploader
                    onUpload={handleImageUpload}
                    currentImage={formData.imageUrl}
                    className="mb-2"
                    acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                    maxSizeMB={10}
                    uploadText="Click or drag an image to upload"
                    replaceText="Click to replace image"
                    removeText="Remove image"
                  />
                  
                  {formData.imageUrl && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ImageIcon className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-purple-900">
                            Image-to-Video Mode Active
                          </span>
                        </div>
                        <button
                          onClick={() => handleImageUpload('')}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-purple-700 mt-1">
                        Your prompt will describe how to animate or modify this image.
                      </p>
                    </div>
                  )}
                </div>

                {/* Basic Settings */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspect Ratio
                    </label>
                    <select
                      value={formData.aspectRatio}
                      onChange={(e) => handleInputChange('aspectRatio', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {options.aspectRatios.map(ratio => (
                        <option key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Duration
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {options.durationOptions.map(duration => (
                        <option key={duration.value} value={duration.value}>
                          {duration.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <select
                      value={formData.quality}
                      onChange={(e) => handleInputChange('quality', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={formData.duration === 8 && formData.quality === '1080p'}
                    >
                      {options.qualityOptions.map(quality => (
                        <option 
                          key={quality.value} 
                          value={quality.value}
                          disabled={formData.duration === 8 && quality.value === '1080p'}
                        >
                          {quality.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parameter Validation Warning */}
                {!paramValidation.valid && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center text-amber-800">
                      <Info className="w-4 h-4 mr-2" />
                      <span className="text-sm">{paramValidation.error}</span>
                    </div>
                  </div>
                )}

                {/* Generation Button */}
                <UniversalGenerateButton
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  disabled={!formData.prompt.trim() || !paramValidation.valid || userCredits < requiredCredits}
                  className="w-full"
                  variant="runway"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating Video...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      {formData.imageUrl ? (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Video from Image ({requiredCredits} Credits)
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Generate Video ({requiredCredits} Credits)
                        </>
                      )}
                    </span>
                  )}
                </UniversalGenerateButton>
              </div>

              {/* Video Result Display */}
              <VideoResultDisplay
                video={generatedVideo}
                taskId={taskId}
                onRetry={() => {
                  // Clear current results and retry with the same parameters
                  reset();
                  setTimeout(() => handleGenerate(), 100);
                }}
                onClear={reset}
                isLoading={isGenerating && !generatedVideo}
                generationParams={{
                  prompt: formData.prompt,
                  duration: formData.duration,
                  quality: formData.quality,
                  aspectRatio: formData.aspectRatio,
                  hasImageUrl: !!formData.imageUrl
                }}
                creditsUsed={requiredCredits}
              />
            </div>

            {/* Right Column - Settings */}
            <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-sm p-6 h-fit lg:sticky lg:top-20">
              {/* Credits Display */}
              <PricingDisplay
                userCredits={userCredits}
                requiredCredits={requiredCredits}
                showPurchase={true}
              />

              {/* Generation Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Generation Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium flex items-center">
                      {formData.imageUrl ? (
                        <>
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Image-to-Video
                        </>
                      ) : (
                        <>
                          <Video className="w-3 h-3 mr-1" />
                          Text-to-Video
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">{requiredCredits} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formData.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-medium">{formData.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated time:</span>
                    <span className="font-medium">{estimatedTime}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Pro Tips
                </h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  {formData.imageUrl ? (
                    <>
                      <li className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        Describe specific movements or animations you want to see
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        Mention camera movements like "zoom in" or "pan across"
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        Add environmental effects like wind, rain, or lighting changes
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        Keep animations subtle for more realistic results
                      </li>
                    </>
                  ) : (
                    RUNWAY_VIDEO_CONSTANTS.TIPS.slice(0, 4).map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Generation Progress */}
        {generationProgress && (
          <div className="fixed inset-x-0 bottom-0 bg-white border-t shadow-lg p-4 z-50">
            <div className="container-custom">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{generationProgress.stage}</p>
                    {generationProgress.taskId && (
                      <p className="text-xs text-gray-500">
                        Task ID: {generationProgress.taskId.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
                {generationProgress.estimatedTime && (
                  <div className="text-sm text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {generationProgress.estimatedTime}
                  </div>
                )}
              </div>
              {generationProgress.progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RunwayVideoGeneratorPage;