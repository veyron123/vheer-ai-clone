import React from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { EXAMPLE_PROMPTS } from '../../constants/textToImage.constants';

const PromptInput = ({ prompt, onPromptChange, disabled = false }) => {

  const getRandomPrompt = () => {
    const randomPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    onPromptChange(randomPrompt);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary-500" />
          Text Prompt
        </h3>
        <button
          onClick={getRandomPrompt}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          title="Generate random prompt"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Random</span>
        </button>
      </div>

      {/* Main Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Describe what you want to create
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Steampunk flying bicycle in the air, powered by a cute squirrel with aviator goggles, vibrant, painterly"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={11}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default PromptInput;