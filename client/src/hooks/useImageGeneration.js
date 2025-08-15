import { useState, useRef } from 'react';
import { generateAnimeImage, uploadImage } from '../services/imageGeneration';
import { detectAspectRatio, fileToBase64 } from '../utils/image.utils';

export const useImageGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const fileInputRef = useRef(null);

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
    setUploadedImage(null);
    setGeneratedImage(null);
    setGenerationTime(null);
  };

  const generateImage = async (style, aiModel, aspectRatio) => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }
    
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
      
      // Determine aspect ratio for GPT Image
      let finalAspectRatio = '1:1';
      if (aiModel === 'gpt-image') {
        finalAspectRatio = aspectRatio;
        if (aspectRatio === 'match') {
          finalAspectRatio = await detectAspectRatio(uploadedImage);
        }
      }
      
      // Generate image
      const result = await generateAnimeImage(imageUrl, style, aiModel, finalAspectRatio);
      
      // Calculate generation time
      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
      setGenerationTime(timeTaken);
      
      // Update generated image
      if (result?.images?.[0]?.url) {
        setGeneratedImage(result.images[0].url);
      }
    } catch (error) {
      console.error('Generation error:', error);
      
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
    generateImage
  };
};