import React from 'react';
import InlineMockupGenerator from './InlineMockupGenerator';

const MockupSection = ({ 
  imageUrl, 
  aspectRatio, 
  aiModel,
  autoShow = true 
}) => {
  // DEBUG: Логируем что получает MockupSection
  console.log('📋 MockupSection received:', { imageUrl, aspectRatio, aiModel, autoShow });
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
      'flux-pro', 
      'flux-max',
      'flux-dev',
      'flux-schnell'
    ];
    
    // Поддерживаемые соотношения
    const supportedRatios = ['1:1', '4:3'];
    
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
      autoShow={autoShow}
    />
  );
};

export default MockupSection;