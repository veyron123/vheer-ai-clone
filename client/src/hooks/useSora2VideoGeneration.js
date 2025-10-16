import { useState, useCallback } from 'react';
import axios from 'axios';

export const useSora2VideoGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [error, setError] = useState(null);

  // Генерация видео через SORA 2
  const generateVideo = useCallback(async (params) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress({
      stage: 'preparing',
      progress: 10,
      estimatedTime: '2-4 minutes'
    });

    try {
      const response = await axios.post('/api/sora2-video/generate', {
        prompt: params.prompt,
        imageUrl: params.imageUrl,
        aspectRatio: params.aspectRatio,
        n_frames: params.n_frames,
        size: params.size,
        remove_watermark: params.remove_watermark,
        model: 'sora-2-pro-image-to-video'
      });

      if (response.data.success) {
        setTaskId(response.data.taskId);
        setGenerationProgress({
          stage: 'processing',
          progress: 30,
          taskId: response.data.taskId,
          estimatedTime: '2-4 minutes'
        });

        // Периодическая проверка статуса
        const checkStatus = async () => {
          try {
            const statusResponse = await axios.get(`/api/sora2-video/status?taskId=${response.data.taskId}`);

            if (statusResponse.data.success) {
              const { state, resultUrl, error } = statusResponse.data;

              if (state === 'completed' && resultUrl) {
                setGeneratedVideo(resultUrl);
                setGenerationProgress({
                  stage: 'completed',
                  progress: 100,
                  taskId: response.data.taskId
                });
                setIsGenerating(false);
                return;
              } else if (state === 'failed') {
                setError(error || 'Generation failed');
                setGenerationProgress({
                  stage: 'failed',
                  progress: 0,
                  error: error || 'Generation failed'
                });
                setIsGenerating(false);
                return;
              } else {
                // Обновляем прогресс
                const progressMap = {
                  'preparing': 20,
                  'processing': 60,
                  'finalizing': 80
                };

                setGenerationProgress({
                  stage: state,
                  progress: progressMap[state] || 40,
                  taskId: response.data.taskId,
                  estimatedTime: '2-4 minutes'
                });
              }
            }

            // Продолжаем проверку каждые 10 секунд
            setTimeout(checkStatus, 10000);

          } catch (statusError) {
            console.error('Status check error:', statusError);
            setTimeout(checkStatus, 10000);
          }
        };

        // Начинаем проверку статуса через 5 секунд
        setTimeout(checkStatus, 5000);

        return response.data;
      }

    } catch (error) {
      console.error('SORA 2 Video generation error:', error);
      setError(error.response?.data?.error || 'Generation failed');
      setGenerationProgress({
        stage: 'failed',
        progress: 0,
        error: error.response?.data?.error || 'Generation failed'
      });
      setIsGenerating(false);
      throw error;
    }
  }, []);

  // Получение доступных опций SORA 2
  const fetchOptions = useCallback(async () => {
    try {
      const response = await axios.get('/api/sora2-video/options');
      return response.data.options;
    } catch (error) {
      console.error('Failed to fetch SORA 2 options:', error);
      return null;
    }
  }, []);

  // Расчет стоимости в кредитах
  const calculateCredits = useCallback((nFrames, size) => {
    const costs = {
      '10_standard': 80,
      '10_high': 120,
      '15_standard': 120,
      '15_high': 180
    };
    return costs[`${nFrames}_${size}`] || 80;
  }, []);

  // Валидация параметров
  const validateParams = useCallback((nFrames, size) => {
    // SORA 2 не имеет ограничений как Runway
    return { valid: true };
  }, []);

  // Получение предполагаемого времени генерации
  const getEstimatedTime = useCallback((nFrames, size) => {
    return size === 'high' ? '3-5 minutes' : '2-4 minutes';
  }, []);

  // Сброс состояния
  const reset = useCallback(() => {
    setIsGenerating(false);
    setGeneratedVideo(null);
    setGenerationProgress(null);
    setTaskId(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedVideo,
    generationProgress,
    taskId,
    error,
    generateVideo,
    fetchOptions,
    calculateCredits,
    validateParams,
    getEstimatedTime,
    reset
  };
};

export default useSora2VideoGeneration;