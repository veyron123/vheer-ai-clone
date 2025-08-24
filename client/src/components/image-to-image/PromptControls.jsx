import React from 'react';
import { Wand2, AlertCircle } from 'lucide-react';

const PromptControls = ({
  positivePrompt,
  onPositivePromptChange
}) => {
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
    </div>
  );
};

export default PromptControls;