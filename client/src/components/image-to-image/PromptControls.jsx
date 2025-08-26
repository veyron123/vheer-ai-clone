import React, { useState } from 'react';
import { Wand2, AlertCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const PromptControls = ({
  positivePrompt,
  onPositivePromptChange,
  negativePrompt,
  onNegativePromptChange,
  creativeStrength,
  onCreativeStrengthChange,
  controlStrength,
  onControlStrengthChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const generatePromptsAutomatically = () => {
    // Example automatic prompts
    const prompts = [
      'high quality, detailed, professional photograph, sharp focus, vibrant colors',
      'masterpiece, best quality, ultra-detailed, photorealistic, 8k resolution',
      'cinematic lighting, professional composition, award winning photography'
    ];
    
    onPositivePromptChange(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  return (
    <div className="space-y-6">
      {/* Positive Prompts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Prompt
          </label>
          <button
            onClick={generatePromptsAutomatically}
            className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-medium rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3" />
            Generate prompt automatically
          </button>
        </div>
        <textarea
          value={positivePrompt}
          onChange={(e) => onPositivePromptChange(e.target.value)}
          placeholder="Describe what you want to see in the image..."
          className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full px-0 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Show Advanced Settings</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div className="mt-4 space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            
            {/* Negative Prompt */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Negative Prompt
                <span className="text-gray-500 font-normal ml-1">(Optional)</span>
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => onNegativePromptChange(e.target.value)}
                placeholder="Describe what you don't want to see..."
                className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify elements you want to avoid in the generated image
              </p>
            </div>

            {/* Creative Strength */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Creative Strength
                </label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {creativeStrength}
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={creativeStrength}
                  onChange={(e) => onCreativeStrengthChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Creative</span>
                  <span>More Creative</span>
                </div>
                <p className="text-xs text-gray-500">
                  Controls image variation and creativity level (Stylization for Midjourney)
                </p>
              </div>
            </div>

            {/* Control Strength */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Control Strength
                </label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {controlStrength}
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={controlStrength}
                  onChange={(e) => onControlStrengthChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Control</span>
                  <span>More Control</span>
                </div>
                <p className="text-xs text-gray-500">
                  Controls how closely the output matches your prompts (Chaos inverse for Midjourney)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptControls;