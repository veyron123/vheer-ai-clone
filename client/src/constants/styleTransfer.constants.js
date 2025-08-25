// AI Models Configuration for Style Transfer
export const STYLE_TRANSFER_AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' }
  },
  FLUX_MAX: {
    id: 'flux-max',
    name: 'Flux Max',
    badge: { text: 'Quality', color: 'bg-primary-400 text-white' }
  },
  GPT_IMAGE: {
    id: 'gpt-image',
    name: 'GPT Image',
    badge: { text: '👑', color: 'bg-red-500 text-white' }
  },
  QWEN_IMAGE: {
    id: 'qwen-image',
    name: 'Qwen Image',
    badge: { text: 'NEW', color: 'bg-green-500 text-white' }
  }
};

// Style Transfer Configuration
export const STYLE_TRANSFER_STYLES = [
  { id: 'studio-ghibli', name: 'Studio Ghibli Style', image: '/Style Transfer images/studio-ghibli.jpg' },
  { id: 'pixar-style', name: 'Pixar Style', image: '/Style Transfer images/pixar-style.jpg' },
  { id: 'pixel-art', name: 'Pixel Art Style', image: '/Style Transfer images/pixel-art.jpg' },
  { id: 'marvel-comic-anime', name: 'Marvel Comic Anime Style', image: '/Style Transfer images/marvel-comic-anime.jpg' },
  { id: 'dc-comic', name: 'DC Comic Style', image: '/Style Transfer images/dc-comic.jpg' },
  { id: 'japanese-ukiyo-e', name: 'Japanese Ukiyo-e Style', image: '/Style Transfer images/japanese-ukiyo-e.png' },
  { id: 'simpsons', name: 'Simpsons Style', image: '/Style Transfer images/simpsons.jpg' },
  { id: 'flat-illustration', name: 'Flat Illustration Style', image: '/Style Transfer images/flat-illustration.jpg' },
  { id: 'childrens-book', name: 'Children\'s Book Style', image: '/Style Transfer images/childrens-book.jpg' },
  { id: 'claymation', name: 'Claymation Style', image: '/Style Transfer images/claymation.jpg' },
  { id: 'lego', name: 'Lego Style', image: '/Style Transfer images/lego.jpg' },
  { id: 'jojos-bizarre', name: 'JoJo\'s Bizarre Adventure Style', image: '/Style Transfer images/jojos-bizarre.jpg' },
  { id: 'knitted-yarn', name: 'Knitted Yarn Style', image: '/Style Transfer images/knitted-yarn.jpg' },
  { id: 'rick-morty', name: 'Rick And Morty Style', image: '/Style Transfer images/rick-morty.jpg' },
  { id: '3d person', name: 'Kawaii 3D Character', image: '/Style Transfer images/3d person.png' },
  { id: 'snoopy-comic', name: 'Classic Comic Strip Style', image: '/Style Transfer images/snoopy-comic.jpg' }
  // Remaining styles hidden for now
  // { id: 'minecraft', name: 'Minecraft Style', image: '/Style Transfer images/minecraft.jpg' },
  // { id: 'vintage-oil-painting-anime', name: 'Vintage Oil Painting Anime Style', image: '/Style Transfer images/vintage-oil-painting-anime.jpg' },
  // { id: 'watercolor', name: 'Watercolor Style', image: '/Style Transfer images/watercolor.jpg' },
  // { id: 'acrylic', name: 'Acrylic Style', image: '/Style Transfer images/acrylic.jpg' },
  // { id: 'printmaking', name: 'Printmaking Style', image: '/Style Transfer images/printmaking.jpg' },
  // { id: 'mosaic', name: 'Mosaic Style', image: '/Style Transfer images/mosaic.jpg' },
  // { id: 'fresco-mural', name: 'Fresco & Mural Style', image: '/Style Transfer images/fresco-mural.jpg' },
  // { id: 'abstract-art', name: 'Abstract Art Style', image: '/Style Transfer images/abstract-art.jpg' },
  // { id: 'pop-art', name: 'Pop Art Style', image: '/Style Transfer images/pop-art.jpg' },
  // { id: 'magical-fantasy-anime', name: 'Magical Fantasy Anime Style', image: '/Style Transfer images/magical-fantasy-anime.jpg' },
  // { id: 'medieval-fantasy-anime', name: 'Medieval Fantasy Anime Style', image: '/Style Transfer images/medieval-fantasy-anime.jpg' },
  // { id: 'gothic-fantasy-anime', name: 'Gothic Fantasy Anime Style', image: '/Style Transfer images/gothic-fantasy-anime.jpg' },
  // { id: 'cyberpunk-anime', name: 'Cyberpunk Anime Style', image: '/Style Transfer images/cyberpunk-anime.jpg' },
  // { id: 'steampunk-anime', name: 'Steampunk Anime Style', image: '/Style Transfer images/steampunk-anime.jpg' },
  // { id: 'futuristic-scifi-anime', name: 'Futuristic Sci-Fi Anime Style', image: '/Style Transfer images/futuristic-scifi-anime.jpg' },
  // { id: 'tezuka-osamu', name: 'Tezuka Osamu Style', image: '/Style Transfer images/tezuka-osamu.jpg' },
  // { id: 'south-park', name: 'South Park Style', image: '/Style Transfer images/south-park.jpg' },
  // { id: 'magical-girl-anime', name: 'Magical Girl Anime Style', image: '/Style Transfer images/magical-girl-anime.jpg' },
  // { id: 'kemonomimi-furry-anime', name: 'Kemonomimi & Furry Anime Style', image: '/Style Transfer images/kemonomimi-furry-anime.jpg' },
  // { id: 'bauhaus', name: 'Bauhaus Style', image: '/Style Transfer images/bauhaus.jpg' },
  // { id: 'glitch-art', name: 'Glitch Art Style', image: '/Style Transfer images/glitch-art.jpg' },
  // { id: 'van-gogh', name: 'Van Gogh Style', image: '/Style Transfer images/van-gogh.jpg' },
  // { id: 'picasso', name: 'Picasso Style', image: '/Style Transfer images/picasso.jpg' },
  // { id: 'monet', name: 'Monet Style', image: '/Style Transfer images/monet.jpg' },
  // { id: 'childrens-crayon', name: 'Children\'s Crayon Drawing Style', image: '/Style Transfer images/childrens-crayon.jpg' },
  // { id: 'graffiti', name: 'Graffiti Style', image: '/Style Transfer images/graffiti.jpg' },
  // { id: 'sticker', name: 'Sticker Style', image: '/Style Transfer images/sticker.jpg' },
  // { id: 'geometric-softness', name: 'Geometric Softness Style', image: '/Style Transfer images/geometric-softness.jpg' },
  // { id: 'microtopia', name: 'Microtopia Style', image: '/Style Transfer images/microtopia.jpg' }
];

// Aspect Ratio Options for Style Transfer
export const STYLE_TRANSFER_ASPECT_RATIOS = [
  { id: 'match', name: 'Match input image', description: 'Auto-detect from input' },
  { id: '1:1', name: 'Square (1:1)', description: '1024×1024', gptSupported: true },
  { id: '16:9', name: 'Landscape (16:9)', description: '1344×768', gptMappedTo: '3:2' },
  { id: '9:16', name: 'Portrait (9:16)', description: '768×1344', gptMappedTo: '2:3' },
  { id: '4:3', name: 'Album (4:3)', description: '1152×896', gptMappedTo: '3:2' },
  { id: '3:4', name: 'Portrait (3:4)', description: '896×1152', gptMappedTo: '2:3' }
];

// Example Images for Style Transfer
export const STYLE_TRANSFER_EXAMPLES = [
  {
    id: 1,
    original: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    generated: '/style-transfer-example-1.jpg',
    style: 'Oil Painting'
  },
  {
    id: 2,
    original: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop',
    generated: '/style-transfer-example-2.jpg',
    style: 'Watercolor'
  },
  {
    id: 3,
    original: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    generated: '/style-transfer-example-3.jpg',
    style: 'Digital Art'
  }
];