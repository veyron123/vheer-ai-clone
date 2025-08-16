import React from 'react';
import UniversalGenerateButton from '../common/UniversalGenerateButton';

// KISS: Simple wrapper using unified UniversalGenerateButton
const ImageGenerateButton = ({ onClick, disabled, isGenerating, onClear, aiModel = 'flux-pro' }) => {
  return (
    <UniversalGenerateButton
      onGenerate={onClick}
      onClear={onClear}
      isGenerating={isGenerating}
      disabled={disabled}
      aiModel={aiModel}
      showClearButton={true}
      generateText="Generate"
      clearText="Clear all"
      fullWidth={true}
    />
  );
};

export default ImageGenerateButton;