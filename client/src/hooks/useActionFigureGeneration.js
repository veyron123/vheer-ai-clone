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
      const itemsText = figureItems.trim() ? `Each character should have their own matching accessories placed next to them — for example, ${figureItems}.` : '';

      const stylePrompt = `Create a realistic 3D render of a collectible action figure toy set displayed inside a transparent blister package on a cardboard backing.
If there is more than one subject in the photo, include all of them together in the same packaging — each with their own section and name label.

At the top of the packaging, write all names combined, like "${figureName}" (or only one name if there is one person).
${itemsText}
If there is a pet, show it as a smaller toy figure in the same style, positioned near its owner${figureItems.trim() ? ` with fitting accessories like ${figureItems}` : ''}.

The packaging design is minimalist, cute, and clean — light brown cardboard color, realistic lighting and soft shadows.
The entire package should fill most of the frame (tight composition, front-facing).
Do not include any external background, frame, or environment — only the package itself.`;

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
