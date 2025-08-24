import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Shuffle } from 'lucide-react';

const AdvancedSettings = ({ 
  settings, 
  onSettingsChange, 
  isVisible, 
  onToggleVisibility 
}) => {
  const [showTooltip, setShowTooltip] = useState(null);

  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 2147483647);
    handleSettingChange('seed', randomSeed);
  };

  const clearSeed = () => {
    handleSettingChange('seed', '');
  };

  const Tooltip = ({ content, id }) => (
    <div className="relative inline-block">
      <HelpCircle 
        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help ml-1" 
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
      />
      {showTooltip === id && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-50 max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="border-t pt-6 mt-6">
      {/* Toggle Button */}
      <button
        onClick={onToggleVisibility}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
      >
        <span>Show advanced Options</span>
        {isVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Settings Panel */}
      {isVisible && (
        <div className="mt-3 space-y-4 bg-gray-50 rounded-lg p-3">
          
          {/* Sampling Steps */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-700">Sampling Steps</label>
                <Tooltip id="steps" content="Number of denoising steps. More steps can improve quality but take longer. Range: 1-50" />
              </div>
              <div className="bg-white border rounded px-2 py-1 text-xs font-mono min-w-[40px] text-center">
                {settings.numInferenceSteps}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.numInferenceSteps}
              onChange={(e) => handleSettingChange('numInferenceSteps', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* CFG Scale */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-700">CFG Scale</label>
                <Tooltip id="cfg" content="Classifier-Free Guidance scale. Higher values stick closer to prompt. Range: 1-20" />
              </div>
              <div className="bg-white border rounded px-2 py-1 text-xs font-mono min-w-[40px] text-center">
                {settings.guidanceScale}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={settings.guidanceScale}
              onChange={(e) => handleSettingChange('guidanceScale', parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Seed */}
          <div>
            <div className="flex items-center mb-1">
              <label className="text-xs font-medium text-gray-700">Seed</label>
              <Tooltip id="seed" content="Random seed for reproducible results. Same seed + same prompt = same image" />
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => handleSettingChange('seed', e.target.value)}
                placeholder="Random"
                className="flex-grow px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                min="0"
                max="2147483647"
              />
              <button
                onClick={generateRandomSeed}
                className="p-1 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                title="Generate random seed"
              >
                <Shuffle className="w-3 h-3" />
              </button>
              {settings.seed && (
                <button
                  onClick={clearSeed}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                  title="Clear seed"
                >
                  Clear
                </button>
              )}
            </div>
          </div>


          {/* Output Format & Acceleration - компактно в одну строку */}
          <div className="grid grid-cols-2 gap-3">
            {/* Output Format */}
            <div>
              <div className="flex items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Format</label>
                <Tooltip id="format" content="Image file format. PNG has better quality, JPEG is smaller" />
              </div>
              <div className="flex space-x-1">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="png"
                    checked={settings.outputFormat === 'png'}
                    onChange={(e) => handleSettingChange('outputFormat', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`px-2 py-1 text-xs rounded border text-center transition-colors ${
                    settings.outputFormat === 'png' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}>
                    PNG
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="jpeg"
                    checked={settings.outputFormat === 'jpeg'}
                    onChange={(e) => handleSettingChange('outputFormat', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`px-2 py-1 text-xs rounded border text-center transition-colors ${
                    settings.outputFormat === 'jpeg' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}>
                    JPEG
                  </div>
                </label>
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <div className="flex items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Speed</label>
                <Tooltip id="acceleration" content="Speed vs quality tradeoff. Regular balances both, High prioritizes speed" />
              </div>
              <select
                value={settings.acceleration}
                onChange={(e) => handleSettingChange('acceleration', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="regular">Regular</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>


          {/* Safety Checker & Sync Mode - компактно в одну строку */}
          <div className="grid grid-cols-2 gap-3">
            {/* Safety Checker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-700">Safety</label>
                <Tooltip id="safety" content="Enables content filtering to prevent NSFW or harmful content generation" />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSafetyChecker}
                  onChange={(e) => handleSettingChange('enableSafetyChecker', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Sync Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-700">Sync</label>
                <Tooltip id="sync" content="Wait for image generation to complete before returning. Increases response time but provides direct image access" />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncMode}
                  onChange={(e) => handleSettingChange('syncMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Reset to Defaults */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => onSettingsChange({
                numInferenceSteps: 30,
                guidanceScale: 4,
                seed: '',
                numImages: 1,
                outputFormat: 'png',
                acceleration: 'regular',
                enableSafetyChecker: true,
                syncMode: true
              })}
              className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          box-shadow: 0 0 2px 0px #555;
        }

        .slider::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 2px 0px #555;
        }
      `}</style>
    </div>
  );
};

export default AdvancedSettings;