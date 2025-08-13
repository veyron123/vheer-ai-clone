import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  Download, 
  Eye, 
  EyeOff, 
  Settings2,
  Loader2,
  Info,
  Image as ImageIcon,
  Wand2
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const GeneratePage = () => {
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('stable-diffusion-xl');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const [settings, setSettings] = useState({
    width: 1024,
    height: 1024,
    numOutputs: 1,
    guidanceScale: 7.5,
    numInferenceSteps: 50
  });
  const [generatedImages, setGeneratedImages] = useState([]);

  // Fetch available models
  const { data: models } = useQuery('models', () => 
    api.get('/generate/models').then(res => res.data)
  );

  // Fetch available styles
  const { data: styles } = useQuery('styles', () =>
    api.get('/generate/styles').then(res => res.data)
  );

  // Generate image mutation
  const generateMutation = useMutation(
    (data) => api.post('/generate', data),
    {
      onSuccess: (response) => {
        setGeneratedImages(response.data.images);
        toast.success('Images generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate image');
      }
    }
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    generateMutation.mutate({
      prompt,
      negativePrompt,
      model: selectedModel,
      style: selectedStyle,
      ...settings
    });
  };

  const promptSuggestions = [
    "A serene Japanese garden with cherry blossoms",
    "Cyberpunk city at night with neon lights",
    "Portrait of a mystical forest elf",
    "Abstract colorful geometric patterns",
    "Steampunk airship floating in clouds",
    "Underwater coral reef with tropical fish"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">AI Image Generator</h1>
            <p className="text-gray-600">Transform your ideas into stunning visuals</p>
            <div className="mt-4 inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">{user?.totalCredits || 0} Credits Available</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              {/* Prompt Input */}
              <div className="card p-6">
                <label className="label">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="input min-h-[100px] resize-none"
                  rows={4}
                />
                
                {/* Prompt Suggestions */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Try these prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                      >
                        {suggestion.substring(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model and Style Selection */}
              <div className="card p-6">
                <div className="space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className="label">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="input"
                    >
                      {models?.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.creditsPerImage} credit)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <label className="label">Style (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedStyle(null)}
                        className={`px-3 py-2 rounded-lg text-sm transition ${
                          !selectedStyle 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        None
                      </button>
                      {styles?.slice(0, 8).map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            selectedStyle === style.id 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="card p-6">
                <button
                  onClick={() => setAdvancedSettings(!advancedSettings)}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <span className="font-medium flex items-center">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </span>
                  <span className="text-gray-400">{advancedSettings ? '−' : '+'}</span>
                </button>

                {advancedSettings && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Negative Prompt</label>
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="What to avoid in the image..."
                        className="input resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Width</label>
                        <select
                          value={settings.width}
                          onChange={(e) => setSettings({...settings, width: parseInt(e.target.value)})}
                          className="input"
                        >
                          <option value="512">512px</option>
                          <option value="768">768px</option>
                          <option value="1024">1024px</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Height</label>
                        <select
                          value={settings.height}
                          onChange={(e) => setSettings({...settings, height: parseInt(e.target.value)})}
                          className="input"
                        >
                          <option value="512">512px</option>
                          <option value="768">768px</option>
                          <option value="1024">1024px</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Number of Images</label>
                      <select
                        value={settings.numOutputs}
                        onChange={(e) => setSettings({...settings, numOutputs: parseInt(e.target.value)})}
                        className="input"
                      >
                        <option value="1">1 Image</option>
                        <option value="2">2 Images</option>
                        <option value="4">4 Images</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Guidance Scale ({settings.guidanceScale})</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={settings.guidanceScale}
                        onChange={(e) => setSettings({...settings, guidanceScale: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isLoading || !prompt.trim()}
                className="btn btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateMutation.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Image
                  </>
                )}
              </button>
            </div>

            {/* Output Panel */}
            <div>
              <div className="card p-6 min-h-[600px]">
                {generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    {generatedImages.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative group"
                      >
                        <img
                          src={image.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full rounded-lg"
                        />
                        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                          <button className="p-2 bg-white rounded-lg shadow hover:shadow-lg transition">
                            <Download className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-white rounded-lg shadow hover:shadow-lg transition">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : generateMutation.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="relative">
                      <div className="w-32 h-32 border-4 border-primary-200 rounded-full"></div>
                      <div className="w-32 h-32 border-4 border-primary-500 rounded-full animate-spin absolute top-0 border-t-transparent"></div>
                    </div>
                    <p className="mt-6 text-gray-600">Creating your masterpiece...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ImageIcon className="w-24 h-24 text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg">Your generated images will appear here</p>
                    <p className="text-gray-500 text-sm mt-2">Enter a prompt and click generate to start</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;