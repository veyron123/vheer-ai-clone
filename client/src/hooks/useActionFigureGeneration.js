import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { generateActionFigure } from '../services/imageGeneration';

export const useActionFigureGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const { user } = useAuthStore();

  const handleImageUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setGeneratedImage(null);
      setGenerationTime(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    if (abortControllerRef.current && isGenerating) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setGeneratedImage(null);
    const startTime = Date.now();

    try {
      let imageBase64 = uploadedImage;
      if (uploadedImage.startsWith('blob:')) {
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      const itemsText = figureItems.trim()
        ? `Include small supporting items related to the character's hobby or job next to the figure, like ${figureItems}.`
        : '';

      const basePrompt = `Make a close-up, centered shot of a 3D action figure toy inside a transparent blister package, filling almost the entire frame.
Show the full packaging clearly from the front, with minimal empty background space around it.
The packaging is on a light brown cardboard backing with realistic lighting and soft shadows.
Do not include any environment or frame.
At the top of the package, write in large white text: "${figureName}", and below it smaller: "${figureName}".
${itemsText}
Keep the design minimalist, cute, clean, and realistic — like an official product photo.
Framing: tight crop, front-facing, centered composition, almost no extra background.
Style: 3D PIXAR render, detailed, cute toy aesthetic.`;

      const finalPrompt = `${basePrompt}

Make sure the packaging title highlights: ${figureName}.`;

      const styleReference = {
        id: styleData?.id || 'action-figure-packaging',
        name: styleData?.name || 'Action Figure Packaging',
        image: styleData?.image || '/example-results/idyXE20dVrPCQE62CUUxJ.jpeg'
      };

      const finalAspectRatio = aiModel === 'nano-banana' ? '1:1' : (aspectRatio || '1:1');

      const result = await generateActionFigure(
        imageBase64,
        styleReference.image,
        styleReference.name,
        finalPrompt,
        aiModel,
        finalAspectRatio,
        abortControllerRef.current.signal
      );

      if (!result || (!result.url && !result.imageUrl)) {
        throw new Error('No image generated');
      }

      const endTime = Date.now();
      setGenerationTime(Math.round((endTime - startTime) / 1000));
      setGeneratedImage(result.url || result.imageUrl);

      toast.success(`Action figure "${figureName}" generated successfully!`);

    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Generation cancelled');
        return;
      }

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
    if (abortControllerRef.current && isGenerating) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      toast.error('Generation cancelled');
    }
  };

  return {
    uploadedImage,
    generatedImage,
    generatedImages,
    isGenerating,
    generationTime,
    fileInputRef,
    handleImageUpload,
    handleImageRemove,
    generateActionFigureImage,
    cancelGeneration
  };
};
