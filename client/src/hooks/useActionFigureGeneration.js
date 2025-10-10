import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

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
      // Use the same approach as Pet Portrait - client-side generation
      const token = useAuthStore.getState().token;

      // Convert uploaded image to base64 if needed
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

      // Create the prompt for action figure generation using user input
      const stylePrompt = `Create an action figure named "${figureName}" with the following items and accessories: ${figureItems}. Transform this person into a collectible action figure with detailed sculpting, dynamic pose, and professional product photography look. Include all specified items as accessories in the packaging.`;

      // Setup headers for backend request
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use backend proxy for action figure generation
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/nano-banana/action-figure`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userImageUrl: imageBase64,
          styleImageUrl: styleData.image,
          styleName: figureName,
          prompt: stylePrompt,
          aiModel: aiModel,
          aspectRatio: aspectRatio || '1:1',
          width: 1024,
          height: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error === 'Insufficient credits') {
          throw new Error('Insufficient credits');
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('No image URL received from server');
      }

      const endTime = Date.now();
      setGenerationTime(Math.round((endTime - startTime) / 1000));
      setGeneratedImage(data.imageUrl);

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
