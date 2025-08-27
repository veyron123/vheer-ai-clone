// AI Models Configuration for Image to Image
export const IMAGE_AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux1.Kontext Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' },
    credits: 10
  },
  FLUX_MAX: {
    id: 'flux-max',
    name: 'Flux1.Kontext Max',
    badge: { text: 'Quality', color: 'bg-primary-400 text-white' },
    credits: 20
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

// Aspect Ratio Options
export const IMAGE_ASPECT_RATIOS = [
  { id: 'match', name: 'Match input image', description: 'Auto-detect from input' },
  { id: '1:1', name: 'Square (1:1)', description: '1024×1024', gptSupported: true },
  { id: '16:9', name: 'Landscape (16:9)', description: '1344×768', gptMappedTo: '3:2' },
  { id: '9:16', name: 'Portrait (9:16)', description: '768×1344', gptMappedTo: '2:3' },
  { id: '4:3', name: 'Album (4:3)', description: '1152×896', gptMappedTo: '3:2' },
  { id: '3:4', name: 'Portrait (3:4)', description: '896×1152', gptMappedTo: '2:3' }
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