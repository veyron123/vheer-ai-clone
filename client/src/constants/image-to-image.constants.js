// AI Models Configuration for Image to Image
export const IMAGE_AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux1.Kontext Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' }
  },
  FLUX_MAX: {
    id: 'flux-max',
    name: 'Flux1.Kontext Max',
    badge: { text: 'Quality', color: 'bg-primary-400 text-white' }
  },
  GPT_IMAGE: {
    id: 'gpt-image',
    name: 'Chat GPT Image',
    badge: { text: '👑', color: 'bg-red-500 text-white' }
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
  { id: '16:9', name: 'Landscape (16:9)', description: '1344×768 (→3:2 for GPT)', gptMappedTo: '3:2' },
  { id: '9:16', name: 'Portrait (9:16)', description: '768×1344 (→2:3 for GPT)', gptMappedTo: '2:3' },
  { id: '4:3', name: 'Album (4:3)', description: '1152×896 (→3:2 for GPT)', gptMappedTo: '3:2' },
  { id: '3:4', name: 'Portrait (3:4)', description: '896×1152 (→2:3 for GPT)', gptMappedTo: '2:3' }
];

// Example Images for Image to Image
export const IMAGE_EXAMPLE_IMAGES = [
  {
    id: 1,
    original: '/Screenshot (62).png',
    generated: '/il_794xN.6989129759_igne.webp',
    prompt: 'Professional business portrait'
  },
  {
    id: 2,
    original: '/Screenshot (62).png',
    generated: '/image-to-image-ai-generator.avif',
    prompt: 'Artistic style transfer'
  },
  {
    id: 3,
    original: '/Screenshot (62).png',
    generated: '/Screenshot (59).png',
    prompt: 'Creative transformation'
  }
];