export const RUNWAY_VIDEO_CONSTANTS = {
  // API endpoints
  API: {
    GENERATE: '/api/runway-video/generate',
    STATUS: '/api/runway-video/status',
    OPTIONS: '/api/runway-video/options'
  },

  // Default parameters
  DEFAULTS: {
    DURATION: 5,
    QUALITY: '720p',
    ASPECT_RATIO: '16:9',
    WATERMARK: ''
  },

  // Validation limits
  LIMITS: {
    PROMPT_MAX_LENGTH: 1800,
    PROMPT_MIN_LENGTH: 10
  },

  // Generation stages
  STAGES: {
    IDLE: 'idle',
    PREPARING: 'preparing',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Aspect ratios with display info
  ASPECT_RATIOS: [
    {
      value: '16:9',
      label: 'Landscape (16:9)',
      description: 'Widescreen format',
      icon: '🖥️',
      popular: true
    },
    {
      value: '9:16',
      label: 'Portrait (9:16)',
      description: 'Mobile vertical',
      icon: '📱',
      popular: true
    },
    {
      value: '1:1',
      label: 'Square (1:1)',
      description: 'Instagram square',
      icon: '⬜',
      popular: true
    },
    {
      value: '4:3',
      label: 'Standard (4:3)',
      description: 'Traditional TV',
      icon: '📺',
      popular: false
    },
    {
      value: '3:4',
      label: 'Portrait (3:4)',
      description: 'Vertical format',
      icon: '📄',
      popular: false
    }
  ],

  // Quality options
  QUALITY_OPTIONS: [
    {
      value: '720p',
      label: 'HD (720p)',
      description: 'Good quality, works with all durations',
      recommended: true,
      constraints: []
    },
    {
      value: '1080p',
      label: 'Full HD (1080p)',
      description: 'Best quality, 5-second videos only',
      recommended: false,
      constraints: ['Cannot be used with 8-second duration']
    }
  ],

  // Duration options
  DURATION_OPTIONS: [
    {
      value: 5,
      label: '5 seconds',
      description: 'Shorter video, works with all quality settings',
      recommended: true,
      constraints: []
    },
    {
      value: 8,
      label: '8 seconds',
      description: 'Longer video, 720p only',
      recommended: false,
      constraints: ['Cannot be used with 1080p quality']
    }
  ],

  // Credit costs (base values, actual costs fetched from API)
  BASE_CREDIT_COSTS: {
    '5_seconds_720p': 50,
    '5_seconds_1080p': 65,
    '8_seconds_720p': 75
  },

  // Example prompts for inspiration
  EXAMPLE_PROMPTS: [
    {
      category: 'Nature',
      prompts: [
        'A majestic waterfall cascading down rocky cliffs surrounded by lush greenery',
        'Golden wheat field swaying in the gentle breeze under a clear blue sky',
        'Ocean waves crashing against a rocky shoreline during sunset',
        'Snow-capped mountains reflecting in a crystal-clear alpine lake'
      ]
    },
    {
      category: 'Animals',
      prompts: [
        'A fluffy orange cat playfully chasing a butterfly in a garden',
        'Eagle soaring majestically over mountain peaks at golden hour',
        'Dolphins jumping gracefully out of the ocean waves',
        'Lion walking proudly through African savanna grasslands'
      ]
    },
    {
      category: 'Urban',
      prompts: [
        'Busy city street with people walking and cars passing by',
        'Neon lights reflecting on wet pavement in a cyberpunk city',
        'Time-lapse of clouds moving over modern skyscrapers',
        'Cozy coffee shop with steam rising from fresh coffee cups'
      ]
    },
    {
      category: 'Abstract',
      prompts: [
        'Colorful paint drops creating ripples in slow motion',
        'Geometric shapes morphing and transforming in space',
        'Aurora borealis dancing across the dark night sky',
        'Smoke wisps creating elegant patterns in the air'
      ]
    },
    {
      category: 'Fantasy',
      prompts: [
        'Magical forest with glowing fireflies and floating particles',
        'Dragon soaring through clouds above medieval castle',
        'Enchanted garden with blooming flowers and sparkles',
        'Mystical portal opening with swirling energy effects'
      ]
    }
  ],

  // Image-to-Video specific prompts
  IMAGE_TO_VIDEO_PROMPTS: [
    {
      category: 'Animation Styles',
      prompts: [
        'The subject slowly comes to life with gentle movement',
        'Camera slowly zooms in while keeping the focus sharp',
        'Add subtle motion blur and flowing movement',
        'Create a parallax effect with background separation'
      ]
    },
    {
      category: 'Environmental Effects',
      prompts: [
        'Add falling leaves and gentle wind effects around the scene',
        'Rain starts falling with realistic water droplets',
        'Smoke or mist slowly rolls through the scene',
        'Sunlight filters through and creates moving shadows'
      ]
    },
    {
      category: 'Character Animation',
      prompts: [
        'The person blinks naturally and breathes gently',
        'Hair and clothing move slightly in a gentle breeze',
        'Eyes follow a moving object with subtle head movement',
        'Facial expression gradually changes from neutral to smiling'
      ]
    },
    {
      category: 'Camera Movement',
      prompts: [
        'Camera pans slowly from left to right revealing more of the scene',
        'Smooth dolly movement forward creating depth',
        'Gentle rotation around the main subject',
        'Subtle camera shake for handheld realistic feel'
      ]
    },
    {
      category: 'Magical Effects',
      prompts: [
        'Sparkles and glowing particles appear around the subject',
        'Colors gradually shift and become more vibrant',
        'Objects in the scene start floating gently',
        'A magical aura or glow surrounds the main elements'
      ]
    }
  ],

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

  // File size limits (for image upload)
  FILE_LIMITS: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
  },

  // Generation tips
  TIPS: [
    'Be specific about what you want to see in your video',
    'Mention camera movements like "zooming in" or "panning across"',
    'Describe the mood and atmosphere (serene, energetic, mysterious)',
    'Include details about lighting (golden hour, soft lighting, dramatic)',
    'Specify the style if needed (cinematic, documentary, artistic)',
    'Keep descriptions under 1800 characters for best results'
  ],

  // Performance settings
  POLLING: {
    INTERVAL: 10000, // 10 seconds
    MAX_ATTEMPTS: 60, // 10 minutes total
    TIMEOUT: 600000 // 10 minutes
  }
};

export default RUNWAY_VIDEO_CONSTANTS;