// Anime Styles Configuration
export const ANIME_STYLES = [
  { id: 'disney', name: 'Disney', image: '/Anime Portraite images/Disney.png' },
  { id: 'pixar', name: 'Pixar', image: '/Anime Portraite images/Pixar.png' },
  { id: 'dc-comics', name: 'DC Comics', image: '/Anime Portraite images/DC.png' },
  { id: 'cyberpunk', name: 'Cyberpunk', image: '/Anime Portraite images/Cyberpunk.png' },
  { id: 'pop-art', name: 'Pop Art', image: '/Anime Portraite images/Pop art.png' },
  { id: 'black-white', name: 'Black and White Comic', image: '/Anime Portraite images/Black and White.png' },
  { id: 'anime', name: 'Anime Style', image: '/Anime Portraite images/Anime.png' },
  { id: 'cartoon', name: 'Cartoon Style', image: '/Anime Portraite images/cartoon.png' },
  { id: 'inkpunk', name: 'Inkpunk', image: '/Anime Portraite images/inkpunk.webp' },
  { id: 'claymation', name: 'Claymation', image: '/Anime Portraite images/Claymation.png' },
  { id: 'manga', name: 'Manga', image: '/Anime Portraite images/Manga.png' },
  { id: 'voxel', name: 'Voxel', image: '/Anime Portraite images/Voxel.png' },
  { id: 'expressionist', name: 'Abstract Expressionist', image: '/Anime Portraite images/Expressionist.jpeg' },
  { id: 'caricature', name: 'Caricature', image: '/Anime Portraite images/Caricature.png' },
  { id: 'chinese-paper-cutting', name: 'Chinese Paper Cutting', image: '/Anime Portraite images/Chinese Paper Cutting.png' }
];

// Aspect Ratio Options - Базовые соотношения для всех моделей (кроме Nano-Banana)
export const ASPECT_RATIOS = [
  { id: 'match', name: 'Match input image', description: 'Auto-detect from input' },
  { id: '1:1', name: '1:1 (Square)', description: 'Perfect for social media' },
  { id: '3:4', name: '3:4 (Portrait)', description: 'Portrait format' },
  { id: '4:3', name: '4:3 (Album)', description: 'Classic photo format' },
  { id: '16:9', name: '16:9 (Landscape)', description: 'Wide format' },
  { id: '9:16', name: '9:16 (Portrait)', description: 'Vertical format' }
];

// AI Models Configuration
export const AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux Pro',
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
  NANO_BANANA: {
    id: 'nano-banana',
    name: 'Nano-Banana',
    badge: { text: '🍌', color: 'bg-orange-600 text-white' },
    credits: 20
  }
};

// Example Images
export const EXAMPLE_IMAGES = [
  {
    id: 1,
    original: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    generated: '/il_794xN.6879206739_46as.avif',
    style: 'Anime'
  },
  {
    id: 2,
    original: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop',
    generated: '/il_794xN.6879206749_a1eo (1).avif',
    style: 'Manga'
  },
  {
    id: 3,
    original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    generated: '/il_794xN.6831231318_lw9v.webp',
    style: 'Disney'
  }
];