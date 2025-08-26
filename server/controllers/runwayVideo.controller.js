import RunwayVideoService from '../services/RunwayVideoService.js';
import CreditService from '../services/creditService.js';
import { getUserFriendlyAIError, logAIServiceError } from '../utils/aiServiceErrors.js';

class RunwayVideoController {
  constructor() {
    this.runwayVideoService = new RunwayVideoService();
  }

  /**
   * Generate AI video using Runway API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateVideo(req, res) {
    try {
      console.log('🎬 Runway video generation request received');
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        prompt,
        imageUrl,
        duration = 5,
        quality = '720p',
        aspectRatio = '16:9',
        waterMark = ''
      } = req.body;

      // Validate required parameters
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required and cannot be empty'
        });
      }

      // Handle development mock user vs real user
      let userCredits, newCredits;
      const requiredCredits = this.calculateRequiredCredits(duration, quality);

      if (userId === 'dev-user-123') {
        // Development mock user - simulate credits
        userCredits = 1000;
        newCredits = userCredits - requiredCredits;
        
        console.log('💰 Development Credit check (mock):', {
          userId: 'dev-user-123',
          userCredits,
          requiredCredits,
          hasEnough: userCredits >= requiredCredits
        });
      } else {
        // Real user - use database
        userCredits = await CreditService.getUserCredits(userId);
        
        console.log('💰 Credit check:', {
          userId,
          userCredits,
          requiredCredits,
          hasEnough: userCredits >= requiredCredits
        });

        if (userCredits < requiredCredits) {
          return res.status(402).json({
            success: false,
            message: `Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits}`
          });
        }

        // Deduct credits before generation
        newCredits = await CreditService.updateUserCredits(userId, -requiredCredits);
        
        console.log('💳 Credits deducted:', {
          userId,
          deducted: requiredCredits,
          remaining: newCredits
        });
      }

      if (userCredits < requiredCredits) {
        return res.status(402).json({
          success: false,
          message: `Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits}`
        });
      }

      // Prepare generation parameters
      const generationParams = {
        prompt: prompt.trim(),
        duration: parseInt(duration),
        quality,
        aspectRatio,
        waterMark: waterMark || ''
      };

      // Add image URL if provided
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        generationParams.imageUrl = imageUrl.trim();
      }

      console.log('🚀 Starting video generation with params:', {
        userId,
        prompt: prompt.substring(0, 100) + '...',
        hasImageUrl: !!generationParams.imageUrl,
        duration: generationParams.duration,
        quality: generationParams.quality,
        aspectRatio: generationParams.aspectRatio
      });

      // Generate video
      const result = await this.runwayVideoService.generateVideo(generationParams);

      // Store task creation time for status polling
      this.runwayVideoService.setTaskCreationTime(result.taskId);

      // Log successful generation
      console.log('✅ Video generation initiated successfully:', {
        userId,
        taskId: result.taskId,
        creditsUsed: requiredCredits,
        remainingCredits: newCredits
      });

      res.status(200).json({
        success: true,
        taskId: result.taskId,
        message: result.message,
        creditsUsed: requiredCredits,
        remainingCredits: newCredits,
        estimatedTime: this.getEstimatedTime(duration, quality),
        generationParams: {
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          duration: generationParams.duration,
          quality: generationParams.quality,
          aspectRatio: generationParams.aspectRatio,
          hasImageUrl: !!generationParams.imageUrl
        }
      });

    } catch (error) {
      logAIServiceError(error, 'Runway Video', 'Video generation');
      const userFriendlyMessage = getUserFriendlyAIError(error, 'Runway Video');

      // If credits were deducted but generation failed, refund them (skip for dev user)
      if (req.user?.id && req.user.id !== 'dev-user-123' && error.message.includes('Runway API Error')) {
        try {
          const requiredCredits = this.calculateRequiredCredits(req.body.duration || 5, req.body.quality || '720p');
          await CreditService.updateUserCredits(req.user.id, requiredCredits);
          console.log('💰 Credits refunded due to generation failure:', requiredCredits);
        } catch (refundError) {
          console.error('❌ Failed to refund credits:', refundError.message);
        }
      }

      res.status(500).json({
        success: false,
        message: userFriendlyMessage,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get video generation status (placeholder for future implementation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVideoStatus(req, res) {
    try {
      const { taskId } = req.params;
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      const result = await this.runwayVideoService.getVideoStatus(taskId);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('❌ Video status check failed:', error.message);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Status check failed'
      });
    }
  }

  /**
   * Get available video generation options
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOptions(req, res) {
    try {
      const options = {
        aspectRatios: this.runwayVideoService.getAspectRatios(),
        qualityOptions: this.runwayVideoService.getQualityOptions(), 
        durationOptions: this.runwayVideoService.getDurationOptions(),
        creditCosts: this.getCreditCosts()
      };

      res.status(200).json({
        success: true,
        options
      });

    } catch (error) {
      console.error('❌ Failed to get options:', error.message);
      
      // Fallback options if service is not available
      const fallbackOptions = {
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
        creditCosts: this.getCreditCosts()
      };
      
      res.status(200).json({
        success: true,
        options: fallbackOptions
      });
    }
  }

  /**
   * Calculate required credits based on generation parameters
   * @param {number} duration - Video duration in seconds
   * @param {string} quality - Video quality
   * @returns {number} Required credits
   */
  calculateRequiredCredits(duration, quality) {
    // Updated cost structure for Runway video generation
    const baseCost = 50; // Updated base cost for video generation
    const durationMultiplier = duration === 8 ? 1.5 : 1; // 8-second videos cost more
    const qualityMultiplier = quality === '1080p' ? 1.3 : 1; // 1080p costs more
    
    return Math.ceil(baseCost * durationMultiplier * qualityMultiplier);
  }

  /**
   * Get credit costs for different configurations
   * @returns {Object} Credit cost structure
   */
  getCreditCosts() {
    return {
      '5_seconds_720p': this.calculateRequiredCredits(5, '720p'),
      '5_seconds_1080p': this.calculateRequiredCredits(5, '1080p'),
      '8_seconds_720p': this.calculateRequiredCredits(8, '720p')
    };
  }

  /**
   * Get estimated generation time
   * @param {number} duration - Video duration
   * @param {string} quality - Video quality
   * @returns {string} Estimated time description
   */
  getEstimatedTime(duration, quality) {
    // Runway API typically takes 2-5 minutes for video generation
    if (quality === '1080p') {
      return '3-6 minutes';
    } else if (duration === 8) {
      return '2-5 minutes';
    } else {
      return '2-4 minutes';
    }
  }
}

const runwayVideoController = new RunwayVideoController();
export default runwayVideoController;