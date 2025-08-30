// Pet Portrait Generator Constants
export const PET_PORTRAIT_STYLES = [
  { id: 'regal', name: 'Regal', image: '/Pet Portrait images/regal.jpg' },
  { id: 'military', name: 'Military', image: '/Pet Portrait images/military.jpg' },
  { id: 'presidential', name: 'Presidential', image: '/Pet Portrait images/presidential.jpg' },
  { id: 'astronaut', name: 'Astronaut', image: '/Pet Portrait images/astronaut.jpg' },
  { id: 'victorian', name: 'Victorian', image: '/Pet Portrait images/victorian.jpg' },
  { id: 'wizard', name: 'Wizard', image: '/Pet Portrait images/wizard.jpg' },
  { id: 'doctor', name: 'Doctor', image: '/Pet Portrait images/doctor.jpg' },
  { id: 'samurai', name: 'Samurai', image: '/Pet Portrait images/samurai.jpg' },
  { id: 'graduate', name: 'Graduate', image: '/Pet Portrait images/graduate.jpg' },
  { id: 'fashion', name: 'Fashion', image: '/Pet Portrait images/fashion.jpg' },
  { id: 'western_cowboy', name: 'Western Cowboy', image: '/Pet Portrait images/western_cowboy.jpg' },
  { id: 'vacation', name: 'Vacation', image: '/Pet Portrait images/vacation.jpg' },
  { id: 'christmas', name: 'Christmas', image: '/Pet Portrait images/christmas.jpg' },
  { id: 'bathroom', name: 'Bathroom', image: '/Pet Portrait images/bathroom.jpg' },
  { id: 'pirates', name: 'Pirates', image: '/Pet Portrait images/pirates.jpg' },
  { id: 'birthday', name: 'Birthday', image: '/Pet Portrait images/birthday.jpg' }
];

export const PET_PORTRAIT_MODELS = [
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Professional quality pet portraits',
    credits: 2,
    premium: false
  },
  {
    id: 'gpt-image',
    name: 'GPT Image',
    description: 'AI-powered pet portrait generation',
    credits: 3,
    premium: false
  },
  {
    id: 'qwen-image',
    name: 'Qwen Image',
    description: 'Advanced pet portrait creation',
    credits: 30,
    premium: false
  },
  {
    id: 'nano-banana',
    name: 'Nano-Banana',
    description: 'Fast & creative pet portraits',
    credits: 20,
    premium: false
  }
];

export const PET_PORTRAIT_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', description: 'Perfect for social media' },
  { value: '4:5', label: '4:5 (Portrait)', description: 'Great for profile pictures' },
  { value: '3:4', label: '3:4 (Portrait)', description: 'Classic portrait format' },
  { value: '16:9', label: '16:9 (Landscape)', description: 'Wide format' }
];