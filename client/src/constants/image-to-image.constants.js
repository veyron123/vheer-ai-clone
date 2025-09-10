// AI Models Configuration for Image to Image
export const IMAGE_AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux1.Kontext Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' },
    credits: 10
  },
  GPT_IMAGE: {
    id: 'gpt-image',
    name: 'GPT Image',
    badge: { text: '👑', color: 'bg-red-500 text-white' },
    credits: 30
  },
  QWEN_IMAGE: {
    id: 'qwen-image',
    name: 'Qwen Image',
    badge: { text: 'NEW', color: 'bg-green-500 text-white' },
    credits: 20
  },
  SEEDREAM_V4: {
    id: 'seedream-v4',
    name: 'Seedream V4',
    badge: { text: 'HOT', color: 'bg-orange-500 text-white' },
    credits: 25
  },
  NANO_BANANA: {
    id: 'nano-banana',
    name: 'Nano-Banana',
    badge: { text: '🍌', color: 'bg-orange-600 text-white' },
    credits: 20
  }
  // Temporarily disabled - issues with API
  // MIDJOURNEY: {
  //   id: 'midjourney',
  //   name: 'Midjourney v7',
  //   badge: { text: '🎨 Pro', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' }
  // }
};

// Aspect Ratio Options - Базовые соотношения для всех моделей (кроме Nano-Banana)
export const IMAGE_ASPECT_RATIOS = [
  { id: 'match', name: 'Match input image', description: 'Auto-detect from input' },
  { id: '1:1', name: '1:1 (Square)', description: 'Perfect for social media' },
  { id: '3:4', name: '3:4 (Portrait)', description: 'Portrait format' },
  { id: '4:3', name: '4:3 (Album)', description: 'Classic photo format' },
  { id: '16:9', name: '16:9 (Landscape)', description: 'Wide format' },
  { id: '9:16', name: '9:16 (Portrait)', description: 'Vertical format' }
];

// Example Images for Image to Image
export const IMAGE_EXAMPLE_IMAGES = [
  {
    id: 1,
    original: '/Image to Image images/Screenshot (62).png',
    generated: '/Image to Image images/il_794xN.6989129759_igne.webp',
    prompt: 'Professional business portrait'
  },
  {
    id: 2,
    original: '/Image to Image images/Screenshot (62).png',
    generated: '/Image to Image images/image-to-image-ai-generator.avif',
    prompt: 'Artistic style transfer'
  },
  {
    id: 3,
    original: '/Image to Image images/Screenshot (62).png',
    generated: '/Image to Image images/Screenshot (59).png',
    prompt: 'Creative transformation'
  }
];