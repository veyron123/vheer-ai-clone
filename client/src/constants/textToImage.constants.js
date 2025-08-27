// Text To Image Generator Constants
export const TEXT_TO_IMAGE_MODELS = [
  {
    id: 'gpt-image',
    name: 'GPT Image',
    description: 'AI-powered text to image generation',
    credits: 30,
    premium: false
  },
  {
    id: 'qwen-image',
    name: 'Qwen Image',
    description: 'Advanced text to image creation',
    credits: 20,
    premium: false
  },
  {
    id: 'nano-banana',
    name: 'Nano-Banana',
    description: 'Fast & creative AI generation',
    credits: 20,
    premium: false
  }
];

export const TEXT_TO_IMAGE_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', description: 'Perfect for social media' },
  { value: '16:9', label: '16:9 (Landscape)', description: 'Wide format' },
  { value: '9:16', label: '9:16 (Portrait)', description: 'Vertical format' },
  { value: '4:3', label: '4:3 (Album)', description: 'Classic photo format' },
  { value: '3:4', label: '3:4 (Portrait)', description: 'Portrait format' }
];

export const DEFAULT_SETTINGS = {
  aspectRatio: '1:1',
  style: 'none'
};

export const DEFAULT_ADVANCED_SETTINGS = {
  numInferenceSteps: 30,
  guidanceScale: 4,
  seed: '',
  numImages: 1,
  outputFormat: 'png',
  acceleration: 'regular',
  enableSafetyChecker: true,
  syncMode: true
};

// Example prompts for inspiration
export const EXAMPLE_PROMPTS = [
  "Steampunk flying bicycle in the air, powered by a cute squirrel with aviator goggles, vibrant, painterly",
  "A magical forest with glowing mushrooms and fairy lights, ethereal atmosphere, digital art",
  "Cyberpunk cityscape at night with neon lights reflecting on wet streets, futuristic",
  "A cozy coffee shop in autumn with warm lighting and falling leaves outside the window",
  "Underwater city with coral architecture and swimming dolphins, bioluminescent plants",
  "Space station orbiting a purple planet with two moons, sci-fi concept art"
];