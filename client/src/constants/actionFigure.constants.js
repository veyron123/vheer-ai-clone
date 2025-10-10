// Action Figure Generator Constants - Custom Name Input
export const ACTION_FIGURE_STYLES = [];

export const ACTION_FIGURE_MODELS = [
  {
    id: 'nano-banana',
    name: 'Nano-Banana',
    description: 'Best for action figure style transformation',
    credits: 20,
    premium: false,
    supportsDualImage: true
  },
  {
    id: 'seedream-v4',
    name: 'Seedream V4',
    description: 'Multi-image AI editing & generation',
    credits: 25,
    premium: false,
    supportsDualImage: true
  }
];

export const ACTION_FIGURE_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', description: 'Perfect for social media' },
  { value: '3:4', label: '3:4 (Portrait)', description: 'Classic action figure format' },
  { value: '4:5', label: '4:5 (Portrait)', description: 'Great for profile pictures' },
  { value: '16:9', label: '16:9 (Landscape)', description: 'Wide format' }
];

// Action figure now uses custom user input for name and items
// No predefined prompts needed
