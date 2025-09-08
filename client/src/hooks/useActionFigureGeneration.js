import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { ACTION_FIGURE_PROMPTS } from '../constants/actionFigure.constants';

export const useActionFigureGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
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

  const generateActionFigureImage = async (selectedStyle, styleData, aiModel, aspectRatio) => {
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
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      // Prepare the request
      const formData = new FormData();
      
      // Convert base64 to blob for the user image
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();
      formData.append('userImage', blob, 'user-image.jpg');
      
      // Add style information
      formData.append('styleName', selectedStyle);
      formData.append('styleImageUrl', styleData.image);
      formData.append('aspectRatio', aspectRatio);
      formData.append('aiModel', aiModel);
      
      // Add style-specific prompt
      const stylePrompt = ACTION_FIGURE_PROMPTS[selectedStyle] || 
        'action figure style, collectible toy, detailed sculpting, professional photography';
      formData.append('customPrompt', stylePrompt);

      // Make the request
      const response = await fetch(`${API_BASE}/api/generation/action-figure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.imageUrl) {
        throw new Error('No image URL received from server');
      }

      const endTime = Date.now();
      setGenerationTime(Math.round((endTime - startTime) / 1000));
      setGeneratedImage(data.imageUrl);
      
      toast.success('Action figure generated successfully!');
      
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