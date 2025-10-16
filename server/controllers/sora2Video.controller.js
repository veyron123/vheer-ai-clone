const { createSora2Task, getSora2TaskStatus } = require('../services/Sora2VideoService');

class Sora2VideoController {
  // Создание задачи генерации видео
  async generate(req, res) {
    try {
      const {
        prompt,
        imageUrl,
        aspectRatio,
        n_frames,
        size,
        remove_watermark,
        model
      } = req.body;

      // Валидация обязательных параметров
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          error: 'Prompt is required'
        });
      }

      if (!imageUrl || !imageUrl.trim()) {
        return res.status(400).json({
          error: 'Image URL is required for SORA 2'
        });
      }

      // Создание задачи
      const taskData = {
        prompt: prompt.trim(),
        imageUrl,
        aspectRatio: aspectRatio || 'landscape',
        n_frames: parseInt(n_frames) || 10,
        size: size || 'standard',
        remove_watermark: remove_watermark || true,
        model: model || 'sora-2-pro-image-to-video'
      };

      const result = await createSora2Task(taskData, req.user.id);

      res.json({
        success: true,
        taskId: result.taskId,
        message: 'SORA 2 video generation started'
      });

    } catch (error) {
      console.error('SORA 2 Video generation error:', error);
      res.status(500).json({
        error: 'Failed to start video generation',
        details: error.message
      });
    }
  }

  // Получение статуса задачи
  async status(req, res) {
    try {
      const { taskId } = req.query;

      if (!taskId) {
        return res.status(400).json({
          error: 'Task ID is required'
        });
      }

      const status = await getSora2TaskStatus(taskId);

      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      console.error('SORA 2 Video status error:', error);
      res.status(500).json({
        error: 'Failed to get task status',
        details: error.message
      });
    }
  }

  // Получение доступных опций
  async options(req, res) {
    try {
      const options = {
        aspectRatios: [
          { value: 'landscape', label: 'Landscape (16:9)' },
          { value: 'portrait', label: 'Portrait (9:16)' }
        ],
        durationOptions: [
          { value: 10, label: '10 seconds' },
          { value: 15, label: '15 seconds' }
        ],
        qualityOptions: [
          { value: 'standard', label: 'Standard Quality' },
          { value: 'high', label: 'High Quality' }
        ]
      };

      res.json({
        success: true,
        options
      });

    } catch (error) {
      console.error('SORA 2 Video options error:', error);
      res.status(500).json({
        error: 'Failed to get options',
        details: error.message
      });
    }
  }
}

module.exports = new Sora2VideoController();