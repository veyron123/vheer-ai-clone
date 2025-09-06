import { useState, useRef } from 'react';
import { generatePetPortrait, uploadImage } from '../services/imageGeneration';
import { detectAspectRatio, fileToBase64 } from '../utils/image.utils';

export const usePetPortraitGeneration = () => {
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

  const generatePetPortraitImage = async (selectedStyleId, styleData, aiModel, aspectRatio) => {
    if (!uploadedImage) {
      alert('Please upload a pet image first');
      return;
    }

    if (!selectedStyleId || !styleData) {
      alert('Please select a pet portrait style');
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
      // Prepare user image URL
      let userImageUrl = uploadedImage;
      if (uploadedImage instanceof File) {
        userImageUrl = await uploadImage(uploadedImage);
      }
      
      // Get style image URL from the selected style
      const styleImageUrl = styleData.image;
      const styleName = styleData.name;
      
      // Determine aspect ratio
      let finalAspectRatio = '1:1';
      
      if (aiModel === 'nano-banana') {
        // Nano-Banana always generates 1024x1024 regardless of aspect ratio
        finalAspectRatio = '1:1';
      } else {
        // All other models (GPT Image, Qwen Image, Flux) support aspect ratio selection
        finalAspectRatio = aspectRatio || '1:1';
        if (aspectRatio === 'match' && uploadedImage) {
          finalAspectRatio = await detectAspectRatio(uploadedImage);
        }
      }
      
      console.log('Pet Portrait Generation:', {
        userImageUrl,
        styleImageUrl,
        styleName,
        aiModel,
        finalAspectRatio
      });
      
      // Generate pet portrait with style image
      const result = await generatePetPortrait(
        userImageUrl, 
        styleImageUrl, 
        styleName, 
        aiModel, 
        finalAspectRatio, 
        abortControllerRef.current?.signal
      );
      
      const endTime = Date.now();
      setGenerationTime(Math.round((endTime - startTime) / 1000));
      
      if (result && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        throw new Error('No image generated');
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Pet portrait generation was cancelled');
      } else {
        console.error('Pet portrait generation error:', error);
        alert(error.message || 'Failed to generate pet portrait. Please try again.');
      }
    } finally {
      setIsGenerating(false);
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
    generatePetPortraitImage,
    cancelGeneration
  };
};