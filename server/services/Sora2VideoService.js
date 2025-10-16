const axios = require('axios');
const { deductCredits } = require('./creditService');

class Sora2VideoService {
  constructor() {
    this.baseURL = 'https://api.kie.ai/api/v1/jobs';
    this.apiKey = process.env.KIE_API_KEY; // API ключ Kie
  }

  // Создание задачи генерации видео
  async createTask(taskData, userId) {
    try {
      // Списание кредитов
      const creditCost = this.calculateCredits(taskData.n_frames, taskData.size);
      await deductCredits(userId, creditCost);

      // Подготовка запроса к Kie API
      const requestData = {
        model: taskData.model,
        callBackUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/sora2-video/webhook`,
        input: {
          prompt: taskData.prompt,
          image_urls: [taskData.imageUrl],
          aspect_ratio: taskData.aspectRatio,
          n_frames: taskData.n_frames.toString(),
          size: taskData.size,
          remove_watermark: taskData.remove_watermark
        }
      };

      // Отправка запроса к Kie API
      const response = await axios.post(
        `${this.baseURL}/createTask`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Kie API error: ${response.data.message}`);
      }

      return {
        taskId: response.data.data.taskId,
        creditCost,
        message: 'SORA 2 video generation started successfully'
      };

    } catch (error) {
      console.error('SORA 2 Video creation error:', error);
      throw error;
    }
  }

  // Получение статуса задачи
  async getTaskStatus(taskId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/recordInfo`,
        {
          params: { taskId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Kie API error: ${response.data.message}`);
      }

      const data = response.data.data;

      // Преобразование данных в формат приложения
      return {
        taskId: data.taskId,
        state: this.mapStatus(data.state),
        progress: this.calculateProgress(data.state),
        resultUrl: data.resultJson ? JSON.parse(data.resultJson).resultUrls?.[0] : null,
        error: data.failCode ? {
          code: data.failCode,
          message: data.failMsg
        } : null,
        createdAt: new Date(parseInt(data.createTime)),
        updatedAt: new Date(parseInt(data.updateTime)),
        completedAt: data.completeTime ? new Date(parseInt(data.completeTime)) : null
      };

    } catch (error) {
      console.error('SORA 2 Video status error:', error);
      throw error;
    }
  }

  // Расчет стоимости в кредитах
  calculateCredits(nFrames, size) {
    const baseCosts = {
      '10_standard': 80,
      '10_high': 120,
      '15_standard': 120,
      '15_high': 180
    };

    return baseCosts[`${nFrames}_${size}`] || 80;
  }

  // Преобразование статуса Kie в формат приложения
  mapStatus(kieStatus) {
    const statusMap = {
      'waiting': 'preparing',
      'queuing': 'preparing',
      'generating': 'processing',
      'success': 'completed',
      'fail': 'failed'
    };

    return statusMap[kieStatus] || 'unknown';
  }

  // Расчет прогресса
  calculateProgress(status) {
    const progressMap = {
      'waiting': 10,
      'queuing': 20,
      'generating': 60,
      'success': 100,
      'fail': 0
    };

    return progressMap[status] || 0;
  }

  // Обработка webhook уведомлений от Kie
  async handleWebhook(webhookData) {
    try {
      console.log('SORA 2 Webhook received:', webhookData);

      // Здесь можно добавить логику обработки завершения задачи
      // Например, обновление базы данных, отправка уведомлений и т.д.

      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      console.error('SORA 2 Webhook processing error:', error);
      throw error;
    }
  }
}

module.exports = new Sora2VideoService();