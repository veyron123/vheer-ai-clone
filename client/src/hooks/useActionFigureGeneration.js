import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { generateWithNanoBananaImageToImage } from '../services/nanoBananaGeneration';
import { urlToBase64 } from '../utils/imageUtils';

export const useActionFigureGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();

  const handleImageUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      // Clear any previous generated image
      setGeneratedImage(null);
      setGenerationTime(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setGenerationTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateActionFigureImage = async (figureName, figureItems, styleData, aiModel, aspectRatio) => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!user) {
      toast.error('Please log in to generate action figures');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      // Convert uploaded image to base64 if needed (for nano-banana approach)
      let imageBase64 = uploadedImage;
      if (uploadedImage.startsWith('blob:')) {
        // Convert blob URL to base64
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      // Create the detailed prompt for blister packaging style
      const stylePrompt = `Make a realistic 3D render of an action figure toy displayed inside a transparent blister package, as if it's a real product on cardboard backing.
The packaging background is light brown cardboard with soft shadows and realistic lighting.
Do not use a white or plain background — use a subtle neutral gradient or soft shadow under the package so it looks real and not floating.
At the top of the packaging, write in large white text: "${figureName}", and below it in smaller white text: "${figureName}".
Include a few small supporting items related to the character's job or hobby next to the figure, like ${figureItems}.
Keep the packaging design minimalist, clean, and cute, in a toy-store cartoonish style, but rendered realistically.
Style: detailed, 3D product render, no frame, no environment.`;

      // Use the same nano-banana approach as Pet Portrait generator
      const result = await generateWithNanoBananaImageToImage(
        imageBase64,
        stylePrompt,
        'none',
        aspectRatio || '1:1'
      );

      if (!result || !result.url) {
        throw new Error('No image generated');
      }

      const endTime = Date.now();
      setGenerationTime(Math.round((endTime - startTime) / 1000));
      setGeneratedImage(result.url);

      toast.success(`Action figure "${figureName}" generated successfully!`);

    } catch (error) {
      console.error('Action figure generation error:', error);
      let errorMessage = 'Failed to generate action figure. ';

      if (error.message.includes('credits')) {
        errorMessage += 'Insufficient credits.';
      } else if (error.message.includes('premium')) {
        errorMessage += 'Premium subscription required.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    setIsGenerating(false);
    toast.error('Generation cancelled');
  };

  return {
    uploadedImage,
    generatedImage,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateActionFigureImage,
    cancelGeneration
  };
};
