import React from 'react';
import UniversalGenerateButton from '../common/UniversalGenerateButton';

// Halloween-themed GenerateButton with gothic styling
const GenerateButton = ({ onClick, disabled, isGenerating, aiModel = 'qwen-image', numImages = 1 }) => {
  return (
    <UniversalGenerateButton
      onGenerate={onClick}
      isGenerating={isGenerating}
      disabled={disabled}
      aiModel={aiModel}
      numImages={numImages}
      showClearButton={false}
      generateText="Summon Portrait"
      fullWidth={true}
      gothicStyle={true}
    />
  );
};

export default GenerateButton;
