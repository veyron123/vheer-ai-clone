export const SORA2_VIDEO_CONSTANTS = {
  // API endpoints
  API: {
    GENERATE: '/api/sora2-video/generate',
    STATUS: '/api/sora2-video/status',
    OPTIONS: '/api/sora2-video/options'
  },

  // Default parameters
  DEFAULTS: {
    DURATION: 10,
    QUALITY: 'standard',
    ASPECT_RATIO: 'landscape',
    REMOVE_WATERMARK: true
  },

  // Validation limits
  LIMITS: {
    PROMPT_MAX_LENGTH: 5000,
    PROMPT_MIN_LENGTH: 1
  },

  // Generation stages
  STAGES: {
    IDLE: 'idle',
    PREPARING: 'preparing',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Aspect ratios
  ASPECT_RATIOS: [
    {
      value: 'landscape',
      label: 'Landscape (16:9)',
      description: 'Widescreen format',
      popular: true
    },
    {
      value: 'portrait',
      label: 'Portrait (9:16)',
      description: 'Mobile vertical',
      popular: false
    }
  ],

  // Frame options (duration)
  FRAME_OPTIONS: [
    {
      value: '10',
      label: '10 seconds',
      description: 'Standard duration',
      recommended: true
    },
    {
      value: '15',
      label: '15 seconds',
      description: 'Extended duration',
      recommended: false
    }
  ],

  // Quality options
  QUALITY_OPTIONS: [
    {
      value: 'standard',
      label: 'Standard Quality',
      description: 'Balanced quality and speed',
      recommended: true
    },
    {
      value: 'high',
      label: 'High Quality',
      description: 'Best quality, longer processing',
      recommended: false
    }
  ],

  // Credit costs
  BASE_CREDIT_COSTS: {
    '10_seconds_standard': 80,
    '10_seconds_high': 120,
    '15_seconds_standard': 120,
    '15_seconds_high': 180
  },

  // Model name
  MODEL_NAME: 'sora-2-pro-image-to-video',

  // Status messages
  STATUS_MESSAGES: {
    PREPARING: 'Preparing your video generation...',
    PROCESSING: 'AI is creating your video...',
    FINALIZING: 'Adding finishing touches...',
    COMPLETED: 'Video generation completed!',
    FAILED: 'Video generation failed'
  },

  // Error types
  ERROR_TYPES: {
    INVALID_PROMPT: 'invalid_prompt',
    INSUFFICIENT_CREDITS: 'insufficient_credits',
    PARAMETER_VALIDATION: 'parameter_validation',
    API_ERROR: 'api_error',
    NETWORK_ERROR: 'network_error',
    AUTHENTICATION_ERROR: 'authentication_error'
  },

  // File size limits
  FILE_LIMITS: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
  }
};

export default SORA2_VIDEO_CONSTANTS;