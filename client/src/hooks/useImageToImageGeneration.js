import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { generateImageToImage, uploadImage } from '../services/imageToImageGeneration';
import { fileToBase64 } from '../utils/image.utils';

export const useImageToImageGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [creativeStrength, setCreativeStrength] = useState(5);
  const [controlStrength, setControlStrength] = useState(2);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result);
        setGeneratedImage(null);
        setGenerationTime(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setGenerationTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateImage = async (aiModel, aspectRatio) => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!positivePrompt && !negativePrompt) {
      toast.error('Please add some prompts or generate them automatically');
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
      
      // Generate image using the actual API
      const result = await generateImageToImage(
        imageUrl,
        positivePrompt,
        negativePrompt,
        creativeStrength,
        controlStrength,
        aiModel,
        aspectRatio
      );
      
      // Calculate generation time
      const timeTaken = (Date.now() - startTime) / 1000;
      setGenerationTime(timeTaken);
      
      // Update generated image
      if (result?.images?.[0]?.url) {
        setGeneratedImage(result.images[0].url);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      // Check if error is due to insufficient credits
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient credits') {
        const { required, available } = error.response.data;
        toast.error(`Недостаточно кредитов! Требуется: ${required}, доступно: ${available}`);
      } else if (error.response?.status === 401) {
        toast.error('Необходимо войти в систему для использования AI генераторов');
      } else {
        toast.error('Ошибка генерации изображения. Попробуйте ещё раз.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadedImage(e.target?.result);
            setGeneratedImage(null);
            setGenerationTime(null);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const clearAll = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setGenerationTime(null);
    setPositivePrompt('');
    setNegativePrompt('');
    setCreativeStrength(5);
    setControlStrength(2);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    positivePrompt,
    negativePrompt,
    creativeStrength,
    controlStrength,
    fileInputRef,
    setPositivePrompt,
    setNegativePrompt,
    setCreativeStrength,
    setControlStrength,
    handleImageUpload,
    handleImageRemove,
    generateImage,
    handlePaste,
    clearAll
  };
};