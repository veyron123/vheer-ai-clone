import React from 'react';
import { Wand2, AlertCircle } from 'lucide-react';

const PromptControls = ({
  positivePrompt,
  negativePrompt,
  creativeStrength,
  controlStrength,
  onPositivePromptChange,
  onNegativePromptChange,
  onCreativeStrengthChange,
  onControlStrengthChange
}) => {
  const generatePromptsAutomatically = () => {
    // Example automatic prompts
    const prompts = [
      'high quality, detailed, professional photograph, sharp focus, vibrant colors',
      'masterpiece, best quality, ultra-detailed, photorealistic, 8k resolution',
      'cinematic lighting, professional composition, award winning photography'
    ];
    
    const negativePrompts = [
      'blurry, low quality, distorted, deformed',
      'bad anatomy, ugly, duplicate, morbid, mutilated',
      'low resolution, worst quality, normal quality, jpeg artifacts'
    ];
    
    onPositivePromptChange(prompts[Math.floor(Math.random() * prompts.length)]);
    onNegativePromptChange(negativePrompts[Math.floor(Math.random() * negativePrompts.length)]);
  };

  return (
    <div className="space-y-6">

      {/* Positive Prompts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Positive prompts
          </label>
          <button
            onClick={generatePromptsAutomatically}
            className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-medium rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3" />
            Generate prompts automatically
          </button>
        </div>
        <textarea
          value={positivePrompt}
          onChange={(e) => onPositivePromptChange(e.target.value)}
          placeholder="Describe what you want to see in the image..."
          className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Negative Prompts */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Negative prompts
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          placeholder="Describe what you don't want to see..."
          className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Creative Strength Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Creative Strength
          </label>
          <span className="text-sm text-gray-500">({creativeStrength})</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={creativeStrength}
          onChange={(e) => onCreativeStrengthChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Less Creative</span>
          <span>More Creative</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Controls image variation and creativity level (Stylization for Midjourney)
        </p>
      </div>

      {/* Control Strength Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Control Strength
          </label>
          <span className="text-sm text-gray-500">({controlStrength})</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={controlStrength}
          onChange={(e) => onControlStrengthChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Less Control</span>
          <span>More Control</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Controls how closely the output matches your prompts (Chaos inverse for Midjourney)
        </p>
      </div>
    </div>
  );
};

export default PromptControls;