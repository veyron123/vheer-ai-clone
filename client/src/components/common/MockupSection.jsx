import React from 'react';
import InlineMockupGenerator from './InlineMockupGenerator';

const MockupSection = ({ 
  imageUrl, 
  aspectRatio, 
  aiModel,
  scale,
  autoShow = true 
}) => {
  // DEBUG: Логируем что получает MockupSection
  console.log('📋 MockupSection received:', { imageUrl, aspectRatio, aiModel, scale, autoShow });
  // Определяем, можно ли показать мокап
  const canShowMockup = () => {
    if (!imageUrl) {
      console.log('❌ MockupSection: No imageUrl provided');
      return false;
    }
    
    // Поддерживаемые модели
    const supportedModels = [
      'gpt-image', 
      'qwen-image', 
      'nano-banana',
      'flux-pro', 
      'flux-max',
      'flux-dev',
      'flux-schnell',
      'seedream-v4'
    ];
    
    // Поддерживаемые соотношения
    const supportedRatios = ['match', '1:1', '16:9', '9:16', '4:3', '3:4'];
    
    // Проверяем модель (если не указана, считаем что поддерживается)
    const modelSupported = !aiModel || supportedModels.includes(aiModel);
    
    // Проверяем соотношение (если не указано, считаем что поддерживается)
    const ratioSupported = !aspectRatio || supportedRatios.includes(aspectRatio);
    
    console.log('🔍 MockupSection checks:', { 
      modelSupported, 
      ratioSupported, 
      aiModel, 
      aspectRatio,
      finalResult: modelSupported && ratioSupported 
    });
    
    return modelSupported && ratioSupported;
  };

  if (!canShowMockup()) {
    return null;
  }

  return (
    <InlineMockupGenerator
      imageUrl={imageUrl}
      aspectRatio={aspectRatio || '1:1'}
      scale={scale}
      autoShow={autoShow}
    />
  );
};

export default MockupSection;