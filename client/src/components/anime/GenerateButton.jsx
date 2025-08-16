import React from 'react';
import UniversalGenerateButton from '../common/UniversalGenerateButton';

// KISS: Simple wrapper using unified UniversalGenerateButton
const GenerateButton = ({ onClick, disabled, isGenerating, aiModel = 'flux-pro' }) => {
  return (
    <UniversalGenerateButton
      onGenerate={onClick}
      isGenerating={isGenerating}
      disabled={disabled}
      aiModel={aiModel}
      showClearButton={false}
      generateText="Generate"
      fullWidth={true}
    />
  );
};

export default GenerateButton;