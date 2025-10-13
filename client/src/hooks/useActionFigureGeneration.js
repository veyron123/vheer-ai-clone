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
        ? `Each character should have their own matching accessories placed next to them — for example, ${figureItems}.`
        : '';

      const basePrompt = `Create a realistic 3D render of a collectible action figure toy set displayed inside a transparent blister package on a cardboard backing.
If there is more than one subject in the photo, include all of them together in the same packaging — each with their own section and name label.

At the top of the packaging, write all names combined, like "${figureName}" (or only one name if there is one person).
${itemsText}
If there is a pet, show it as a smaller toy figure in the same style, positioned near its owner${figureItems.trim() ? ` with fitting accessories like ${figureItems}` : ''}.

The packaging design is minimalist, cute, and clean — light brown cardboard color, realistic lighting and soft shadows.
The entire package should fill most of the frame (tight composition, front-facing).
Do not include any external background, frame, or environment — only the package itself.

Style: 3D Pixar Style product render, cartoonish cute toy aesthetic, professional lighting.`;

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
