import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';

export const useRunwayVideoGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const { user, isAuthenticated } = useAuthStore();
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);

  // Get available options for video generation
  const [options, setOptions] = useState({
    aspectRatios: [
      { value: '16:9', label: 'Landscape (16:9)', description: 'Widescreen format' },
      { value: '9:16', label: 'Portrait (9:16)', description: 'Mobile vertical' },
      { value: '1:1', label: 'Square (1:1)', description: 'Instagram square' },
      { value: '4:3', label: 'Standard (4:3)', description: 'Traditional TV' },
      { value: '3:4', label: 'Portrait (3:4)', description: 'Vertical format' }
    ],
    qualityOptions: [
      { 
        value: '720p', 
        label: 'HD (720p)', 
        description: 'Good quality, works with all durations',
        constraints: []
      },
      { 
        value: '1080p', 
        label: 'Full HD (1080p)', 
        description: 'Best quality, 5-second videos only',
        constraints: ['Cannot be used with 8-second duration']
      }
    ],
    durationOptions: [
      { 
        value: 5, 
        label: '5 seconds', 
        description: 'Shorter video, works with all quality settings',
        constraints: []
      },
      { 
        value: 8, 
        label: '8 seconds', 
        description: 'Longer video, 720p only',
        constraints: ['Cannot be used with 1080p quality']
      }
    ],
    creditCosts: {
      '5_seconds_720p': 50,
      '5_seconds_1080p': 65,
      '8_seconds_720p': 75
    }
  });

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/runway-video/options', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOptions(data.options);
        }
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }, []);

  const generateVideo = useCallback(async (params) => {
    if (!isAuthenticated) {
      toast.error('Please log in to generate videos');
      return null;
    }

    const {
      prompt,
      imageUrl,
      duration = 5,
      quality = '720p',
      aspectRatio = '16:9',
      waterMark = ''
    } = params;

    if (!prompt || prompt.trim().length === 0) {
      toast.error('Please enter a video description');
      return null;
    }

    if (prompt.length > 1800) {
      toast.error('Description must be 1800 characters or less');
      return null;
    }

    // Validate parameter combinations
    if (duration === 8 && quality === '1080p') {
      toast.error('Cannot use 1080p quality with 8-second duration');
      return null;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setGenerationProgress({
      stage: 'Preparing video generation...',
      progress: 0
    });

    try {
      console.log('🚀 Starting video generation:', {
        prompt: prompt.substring(0, 100) + '...',
        duration,
        quality,
        aspectRatio,
        hasImageUrl: !!imageUrl
      });

      const requestBody = {
        prompt: prompt.trim(),
        duration: parseInt(duration),
        quality,
        aspectRatio,
        waterMark: waterMark || ''
      };

      if (imageUrl && imageUrl.trim()) {
        requestBody.imageUrl = imageUrl.trim();
      }

      const response = await fetch('/api/runway-video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Request failed`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Video generation failed');
      }

      console.log('✅ Video generation started:', data.taskId);
      
      setTaskId(data.taskId);
      setGenerationProgress({
        stage: 'Video generation in progress...',
        progress: 25,
        taskId: data.taskId,
        estimatedTime: data.estimatedTime,
        creditsUsed: data.creditsUsed,
        remainingCredits: data.remainingCredits
      });

      toast.success(`Video generation started! Task ID: ${data.taskId.substring(0, 8)}...`);

      // Start polling for status
      startStatusPolling(data.taskId);

      return {
        taskId: data.taskId,
        creditsUsed: data.creditsUsed,
        remainingCredits: data.remainingCredits,
        estimatedTime: data.estimatedTime,
        generationParams: data.generationParams
      };

    } catch (error) {
      console.error('❌ Video generation failed:', error);
      
      setGenerationProgress({
        stage: 'Generation failed',
        progress: 0,
        error: error.message
      });

      // Show appropriate error message
      if (error.message.includes('Insufficient credits')) {
        toast.error('Not enough credits for video generation');
      } else if (error.message.includes('Authentication')) {
        toast.error('Please log in to continue');
      } else {
        toast.error(error.message || 'Video generation failed');
      }

      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isAuthenticated]);

  // Calculate required credits for given parameters
  const calculateCredits = useCallback((duration, quality) => {
    const key = `${duration}_seconds_${quality}`;
    return options.creditCosts[key] || 10;
  }, [options.creditCosts]);

  // Check if parameters are valid
  const validateParams = useCallback((duration, quality) => {
    if (duration === 8 && quality === '1080p') {
      return {
        valid: false,
        error: 'Cannot use 1080p quality with 8-second duration'
      };
    }
    return { valid: true };
  }, []);

  // Get estimated time for generation
  const getEstimatedTime = useCallback((duration, quality) => {
    if (quality === '1080p') {
      return '3-6 minutes';
    } else if (duration === 8) {
      return '2-5 minutes';
    } else {
      return '2-4 minutes';
    }
  }, []);

  // Status polling
  const checkStatus = useCallback(async (taskId) => {
    try {
      const response = await fetch(`/api/runway-video/status/${taskId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Status check failed:', error);
      return null;
    }
  }, []);

  // Start status polling
  const startStatusPolling = useCallback((taskId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }

    let pollAttempts = 0;
    const maxPollAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds

    console.log('🔄 Starting status polling for task:', taskId);

    pollingIntervalRef.current = setInterval(async () => {
      pollAttempts++;
      
      try {
        const statusData = await checkStatus(taskId);
        
        if (statusData && statusData.success) {
          const { status, progress, message, videoUrl, error } = statusData;
          
          console.log(`📊 Status update (${pollAttempts}/${maxPollAttempts}):`, {
            status,
            progress,
            message
          });

          // Update progress
          setGenerationProgress(prev => ({
            ...prev,
            progress: progress || prev?.progress || 50,
            stage: message || prev?.stage || 'Processing video...'
          }));

          // Check for completion
          if (status === 'completed' && videoUrl) {
            console.log('✅ Video generation completed:', videoUrl);
            
            setGeneratedVideo({
              url: videoUrl,
              taskId,
              processingTime: `${Math.round((pollAttempts * pollInterval) / 1000)}s`,
              thumbnail: statusData.thumbnail
            });
            
            setGenerationProgress(null);
            setIsGenerating(false);
            
            clearInterval(pollingIntervalRef.current);
            clearTimeout(pollingTimeoutRef.current);
            
            toast.success('Video generated successfully!');
            return;
          }

          // Check for errors
          if (status === 'failed' || error) {
            console.error('❌ Video generation failed:', error || 'Unknown error');
            
            setGeneratedVideo({ error: error || 'Video generation failed' });
            setGenerationProgress(null);
            setIsGenerating(false);
            
            clearInterval(pollingIntervalRef.current);
            clearTimeout(pollingTimeoutRef.current);
            
            toast.error('Video generation failed');
            return;
          }
        }
        
        // Check if we've exceeded max attempts
        if (pollAttempts >= maxPollAttempts) {
          console.warn('⏱️ Polling timeout reached');
          
          setGenerationProgress(prev => ({
            ...prev,
            stage: 'Generation taking longer than expected...',
            progress: prev?.progress || 75
          }));
          
          clearInterval(pollingIntervalRef.current);
          
          // Continue with slower polling
          pollingTimeoutRef.current = setTimeout(() => {
            startSlowPolling(taskId);
          }, 10000);
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        
        if (pollAttempts >= maxPollAttempts) {
          setGeneratedVideo({ error: 'Status check failed' });
          setGenerationProgress(null);
          setIsGenerating(false);
          clearInterval(pollingIntervalRef.current);
          toast.error('Unable to check video status');
        }
      }
    }, pollInterval);
    
  }, [checkStatus]);

  // Slower polling for extended generation times
  const startSlowPolling = useCallback((taskId) => {
    let slowPollAttempts = 0;
    const maxSlowPollAttempts = 12; // 12 more attempts at 30-second intervals = 6 more minutes
    
    console.log('🐌 Starting slow polling for task:', taskId);
    
    pollingIntervalRef.current = setInterval(async () => {
      slowPollAttempts++;
      
      try {
        const statusData = await checkStatus(taskId);
        
        if (statusData && statusData.success) {
          const { status, progress, message, videoUrl, error } = statusData;
          
          if (status === 'completed' && videoUrl) {
            setGeneratedVideo({
              url: videoUrl,
              taskId,
              processingTime: 'Extended processing time',
              thumbnail: statusData.thumbnail
            });
            
            setGenerationProgress(null);
            setIsGenerating(false);
            clearInterval(pollingIntervalRef.current);
            toast.success('Video generated successfully!');
            return;
          }

          if (status === 'failed' || error) {
            setGeneratedVideo({ error: error || 'Video generation failed' });
            setGenerationProgress(null);
            setIsGenerating(false);
            clearInterval(pollingIntervalRef.current);
            toast.error('Video generation failed');
            return;
          }

          // Update progress for slow polling
          setGenerationProgress(prev => ({
            ...prev,
            progress: Math.min((prev?.progress || 75) + 2, 95),
            stage: message || 'Final processing steps...'
          }));
        }
        
        if (slowPollAttempts >= maxSlowPollAttempts) {
          console.warn('⏱️ Extended polling timeout reached');
          setGenerationProgress(prev => ({
            ...prev,
            stage: 'Video may still be processing. Check back later.',
            progress: 95
          }));
          clearInterval(pollingIntervalRef.current);
        }
        
      } catch (error) {
        console.error('Slow polling error:', error);
        if (slowPollAttempts >= maxSlowPollAttempts) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    }, 30000); // 30-second intervals
  }, [checkStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Reset generation state
  const reset = useCallback(() => {
    stopPolling();
    setIsGenerating(false);
    setGeneratedVideo(null);
    setGenerationProgress(null);
    setTaskId(null);
  }, [stopPolling]);

  return {
    // State
    isGenerating,
    generatedVideo,
    generationProgress,
    taskId,
    options,
    userCredits: user?.totalCredits || 1000, // Default 1000 credits for development testing

    // Actions
    generateVideo,
    checkStatus,
    fetchOptions,
    reset,
    startStatusPolling,
    stopPolling,

    // Utilities
    calculateCredits,
    validateParams,
    getEstimatedTime
  };
};