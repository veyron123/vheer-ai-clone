// Anime Styles Configuration
export const ANIME_STYLES = [
  { id: 'disney', name: 'Disney', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=200&h=200&fit=crop' },
  { id: 'pixar', name: 'Pixar', image: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=200&h=200&fit=crop' },
  { id: 'dc-comics', name: 'DC Comics', image: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=200&h=200&fit=crop' },
  { id: 'cyberpunk', name: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1636955816868-fcb881e57954?w=200&h=200&fit=crop' },
  { id: 'pop-art', name: 'Pop Art', image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&h=200&fit=crop' },
  { id: 'black-white', name: 'Black and White Comic', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=200&h=200&fit=crop' },
  { id: 'bright-realistic', name: 'Bright and Realistic', image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=200&fit=crop' },
  { id: 'fantasy', name: 'Fantasy ANime Style', image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=200&h=200&fit=crop' },
  { id: 'cartoon-poster', name: 'Cartoon Poster', image: 'https://images.unsplash.com/photo-1611457194403-d3aca4cf9d11?w=200&h=200&fit=crop' },
  { id: 'inkpunk', name: 'Inkpunk', image: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=200&h=200&fit=crop' },
  { id: 'springfield', name: 'Springfield', image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&h=200&fit=crop' },
  { id: 'claymation', name: 'Claymation', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop' },
  { id: 'anime-sketch', name: 'Anime Sketch', image: 'https://images.unsplash.com/photo-1605478371310-e9e6c8ebf339?w=200&h=200&fit=crop' },
  { id: 'manga', name: 'Manga', image: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=200&h=200&fit=crop' },
  { id: 'retro-anime', name: 'Retro Anime', image: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=200&h=200&fit=crop' },
  { id: 'neon-punk', name: 'Neon Punk', image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=200&h=200&fit=crop' }
];

// Aspect Ratio Options
export const ASPECT_RATIOS = [
  { id: 'match', name: 'Match input image', description: 'Auto-detect from input' },
  { id: '1:1', name: 'Square (1:1)', description: '1024×1024', gptSupported: true },
  { id: '16:9', name: 'Landscape (16:9)', description: '1344×768 (→3:2 for GPT)', gptMappedTo: '3:2' },
  { id: '9:16', name: 'Portrait (9:16)', description: '768×1344 (→2:3 for GPT)', gptMappedTo: '2:3' },
  { id: '4:3', name: 'Album (4:3)', description: '1152×896 (→3:2 for GPT)', gptMappedTo: '3:2' },
  { id: '3:4', name: 'Portrait (3:4)', description: '896×1152 (→2:3 for GPT)', gptMappedTo: '2:3' }
];

// AI Models Configuration
export const AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' }
  },
  FLUX_MAX: {
    id: 'flux-max',
    name: 'Flux Max',
    badge: { text: 'Quality', color: 'bg-purple-400 text-white' }
  },
  GPT_IMAGE: {
    id: 'gpt-image',
    name: 'GPT Image',
    badge: { text: '👑', color: 'bg-red-500 text-white' }
  }
};

// Example Images
export const EXAMPLE_IMAGES = [
  {
    id: 1,
    original: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    generated: 'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=300&h=400&fit=crop',
    style: 'Disney'
  },
  {
    id: 2,
    original: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop',
    generated: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop',
    style: 'Springfield'
  },
  {
    id: 3,
    original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    generated: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300&h=400&fit=crop',
    style: 'Pixar'
  }
];