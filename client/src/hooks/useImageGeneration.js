import { useState, useRef } from 'react';
import { generateAnimeImage, uploadImage } from '../services/imageGeneration';
import { detectAspectRatio, fileToBase64 } from '../utils/image.utils';

export const useImageGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      const base64 = await fileToBase64(file);
      setUploadedImage(base64);
      setGeneratedImage(null);
      setGenerationTime(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    }
  };

  const handleImageRemove = () => {
    // Cancel any ongoing generation
    if (abortControllerRef.current && isGenerating) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
    
    setUploadedImage(null);
    setGeneratedImage(null);
    setGenerationTime(null);
  };

  const generateImage = async (style, aiModel, aspectRatio) => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }
    
    // Cancel any previous generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this generation
    abortControllerRef.current = new AbortController();
    
    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationTime(null);
    
    const startTime = Date.now();
    
    try {
      // Prepare image URL
      let imageUrl = uploadedImage;
      if (uploadedImage instanceof File) {
        imageUrl = await uploadImage(uploadedImage);
      }
      
      // Determine aspect ratio
      let finalAspectRatio = '1:1';
      
      if (aiModel === 'gpt-image') {
        // For GPT Image - use selected aspect ratio
        finalAspectRatio = aspectRatio || '1:1';
        if (aspectRatio === 'match' && uploadedImage) {
          finalAspectRatio = await detectAspectRatio(uploadedImage);
        }
      } else {
        // For Flux models - always auto-detect from uploaded image
        if (uploadedImage) {
          finalAspectRatio = await detectAspectRatio(uploadedImage);
        }
      }
      
      // Generate image with abort signal
      const result = await generateAnimeImage(
        imageUrl, 
        style, 
        aiModel, 
        finalAspectRatio, 
        abortControllerRef.current.signal
      );
      
      // Calculate generation time
      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
      setGenerationTime(timeTaken);
      
      // Update generated image
      if (result?.images?.[0]?.url) {
        setGeneratedImage(result.images[0].url);
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      // Check if the request was aborted (user cancelled)
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log('Generation cancelled by user');
        return; // Don't show error for user cancellation
      }
      
      // Check if error is due to insufficient credits
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient credits') {
        const { required, available } = error.response.data;
        alert(`Недостаточно кредитов!\n\nТребуется: ${required} кредитов\nДоступно: ${available} кредитов\n\nПополните баланс для продолжения генерации.`);
      } else if (error.response?.status === 401) {
        alert('Необходимо войти в систему для использования AI генераторов.');
      } else {
        alert('Ошибка генерации изображения. Попробуйте ещё раз.');
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

  return {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateImage,
    cancelGeneration
  };
};