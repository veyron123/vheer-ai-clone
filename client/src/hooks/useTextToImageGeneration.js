import { useState, useRef } from 'react';
import { generateTextToImage } from '../services/textToImageGeneration';

export const useTextToImageGeneration = () => {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const abortControllerRef = useRef(null);

  const generateImage = async (prompt, aiModel, aspectRatio, baseImage = null, advancedSettings = null) => {
    if (!prompt.trim()) {
      alert('Please enter a prompt to generate an image');
      return;
    }

    setIsGenerating(true);
    setGenerationTime(null);
    const startTime = Date.now();

    // Create new abort controller for this generation
    abortControllerRef.current = new AbortController();

    try {
      const result = await generateTextToImage(
        prompt.trim(),
        '', // empty negative prompt
        'none', // style
        aiModel,
        aspectRatio,
        abortControllerRef.current.signal,
        baseImage, // Pass base image for image-to-image
        advancedSettings // Pass advanced settings
      );

      if (result.images && result.images.length > 0) {
        if (result.images.length === 1) {
          // Одиночное изображение для обратной совместимости
          setGeneratedImage(result.images[0].url || result.images[0]);
          setGeneratedImages(null);
        } else {
          // Множественные изображения
          setGeneratedImages(result.images);
          setGeneratedImage(null);
        }
        const endTime = Date.now();
        setGenerationTime(Math.round((endTime - startTime) / 1000));
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation was cancelled');
      } else {
        console.error('Text to image generation error:', error);
        alert(error.message || 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current && isGenerating) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const clearImage = () => {
    setGeneratedImage(null);
    setGeneratedImages(null);
    setGenerationTime(null);
  };

  return {
    generatedImage,
    generatedImages,
    isGenerating,
    generationTime,
    generateImage,
    cancelGeneration,
    clearImage
  };
};