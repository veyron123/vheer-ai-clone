import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Upload, 
  Link2, 
  Info,
  Sparkles,
  ChevronDown,
  Download,
  X
} from 'lucide-react';
import { generateAnimeImage, uploadImage } from '../services/imageGeneration';

const AnimeGeneratorPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('disney');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [aiModel, setAiModel] = useState('flux-pro');
  const [aspectRatio, setAspectRatio] = useState('match');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const fileInputRef = useRef(null);

  const animeStyles = [
    { id: 'disney', name: 'Disney', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=200&h=200&fit=crop' },
    { id: 'pixar', name: 'Pixar', image: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=200&h=200&fit=crop' },
    { id: 'dc-comics', name: 'DC Comics', image: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=200&h=200&fit=crop' },
    { id: 'cyberpunk', name: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1636955816868-fcb881e57954?w=200&h=200&fit=crop' },
    { id: 'pop-art', name: 'Pop Art', image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&h=200&fit=crop' },
    { id: 'black-white', name: 'Black and White Comic', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=200&h=200&fit=crop' },
    { id: 'bright-realistic', name: 'Bright and Realistic', image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=200&fit=crop' },
    { id: 'fantasy', name: 'Fantasy ANime Style', image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=200&h=200&fit=crop' },
    { id: 'cartoon-poster', name: 'Cartoon Poster', image: 'https://images.unsplash.com/photo-1611457194403-d3aca4cf9d11?w=200&h=200&fit=crop' },
    { id: 'inkpunk', name: 'Inkpunk', image: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=200&h=200&fit=crop' },
    { id: 'springfield', name: 'Springfield', image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&h=200&fit=crop' },
    { id: 'claymation', name: 'Claymation', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop' },
    { id: 'anime-sketch', name: 'Anime Sketch', image: 'https://images.unsplash.com/photo-1605478371310-e9e6c8ebf339?w=200&h=200&fit=crop' },
    { id: 'manga', name: 'Manga', image: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=200&h=200&fit=crop' },
    { id: 'retro-anime', name: 'Retro Anime', image: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=200&h=200&fit=crop' },
    { id: 'neon-punk', name: 'Neon Punk', image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=200&h=200&fit=crop' }
  ];

  // Example generated images data
  const exampleImages = [
    {
      id: 1,
      original: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
      generated: 'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=300&h=400&fit=crop',
      style: 'Disney'
    },
    {
      id: 2,
      original: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop',
      generated: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop',
      style: 'Springfield'
    },
    {
      id: 3,
      original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      generated: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300&h=400&fit=crop',
      style: 'Pixar'
    }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedImage(null); // Clear previous result
    setGenerationTime(null); // Clear previous time
    
    const startTime = Date.now(); // Track generation start time
    
    try {
      // If uploadedImage is a data URL (base64), we can use it directly
      // Otherwise, we might need to upload it first
      let imageUrl = uploadedImage;
      
      // If it's a File object from upload, convert to base64 or upload
      if (uploadedImage instanceof File) {
        imageUrl = await uploadImage(uploadedImage);
      }
      
      // Generate the anime image with selected AI model
      const result = await generateAnimeImage(imageUrl, selectedStyle, aiModel);
      
      // Calculate generation time
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
      setGenerationTime(timeTaken);
      
      // Update generated image with the result
      if (result && result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0].url);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => {
                  if (!uploadedImage && !generatedImage) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {uploadedImage || generatedImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={generatedImage || uploadedImage} 
                      alt={generatedImage ? "Generated" : "Uploaded"} 
                      className="max-w-full max-h-96 rounded-lg mx-auto"
                    />
                    {generatedImage && (
                      <>
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                          Generated
                        </div>
                        {generationTime && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                            ⏱️ {generationTime}s
                          </div>
                        )}
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImage(null);
                        setGeneratedImage(null);
                        setGenerationTime(null);
                        // Сброс input файла для возможности загрузки того же файла
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {!generatedImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="absolute bottom-2 left-2 bg-white text-black px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                      >
                        <Upload className="w-4 h-4" />
                        Change Image
                      </button>
                    )}
                    {generatedImage && (
                      <a
                        href={generatedImage}
                        download="anime-portrait.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-white text-black px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <button className="bg-yellow-400 text-black font-medium px-6 py-3 rounded-lg mb-4 hover:bg-yellow-500 transition-colors inline-flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload your images
                    </button>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">Or drop image here, paste image or URL</p>
                    <p className="text-sm text-gray-400">jpeg, png, webp images allowed.</p>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Example Results */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Example Results</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {exampleImages.map((example) => (
                  <div key={example.id} className="relative group">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={example.generated} 
                        alt={`${example.style} style`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {example.style}
                    </div>
                    <div className="absolute top-2 right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                      <img 
                        src={example.original} 
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Style Selection and Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              Choose Style
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <Info className="w-4 h-4" />
              </button>
            </h3>
            
            {/* Style Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-[400px] overflow-y-auto">
              {animeStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedStyle === style.id 
                      ? 'border-primary-500 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={style.image} 
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                    <p className="text-white text-[10px] leading-tight">{style.name}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* AI Model Selection */}
            <div className="mb-6">
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Model
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAiModel('flux-pro')}
                  className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    aiModel === 'flux-pro'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Flux Pro
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Fast
                  </span>
                </button>
                <button
                  onClick={() => setAiModel('flux-max')}
                  className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    aiModel === 'flux-max'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Flux Max
                  <span className="absolute -top-2 -right-2 bg-purple-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Quality
                  </span>
                </button>
                <button
                  onClick={() => setAiModel('gpt-image')}
                  className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    aiModel === 'gpt-image'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  GPT Image
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full font-bold">
                    👑
                  </span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">Aspect Ratio</label>
              <button className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-between">
                <span className="text-sm">Match input image</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                uploadedImage && !isGenerating
                  ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate'
              )}
            </button>

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