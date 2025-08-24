import React from 'react';
import UniversalGenerateButton from '../common/UniversalGenerateButton';

// KISS: Simple wrapper using unified UniversalGenerateButton
const GenerateButton = ({ onClick, disabled, isGenerating, aiModel = 'flux-pro', numImages = 1 }) => {
  return (
    <UniversalGenerateButton
      onGenerate={onClick}
      isGenerating={isGenerating}
      disabled={disabled}
      aiModel={aiModel}
      numImages={numImages}
      showClearButton={false}
      generateText="Generate"
      fullWidth={true}
    />
  );
};

export default GenerateButton;