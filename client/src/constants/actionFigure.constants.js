// Action Figure Generator Constants
export const ACTION_FIGURE_STYLES = [
  { id: 'superhero-classic', name: 'Classic Superhero', image: '/action-figure-styles/superhero-classic.jpg' },
  { id: 'marvel-hero', name: 'Marvel Hero', image: '/action-figure-styles/marvel-hero.jpg' },
  { id: 'dc-hero', name: 'DC Hero', image: '/action-figure-styles/dc-hero.jpg' },
  { id: 'anime-figure', name: 'Anime Figure', image: '/action-figure-styles/anime-figure.jpg' },
  { id: 'robot-mech', name: 'Robot Mech', image: '/action-figure-styles/robot-mech.jpg' },
  { id: 'ninja-warrior', name: 'Ninja Warrior', image: '/action-figure-styles/ninja-warrior.jpg' },
  { id: 'space-marine', name: 'Space Marine', image: '/action-figure-styles/space-marine.jpg' },
  { id: 'fantasy-knight', name: 'Fantasy Knight', image: '/action-figure-styles/fantasy-knight.jpg' },
  { id: 'cyberpunk-soldier', name: 'Cyberpunk Soldier', image: '/action-figure-styles/cyberpunk-soldier.jpg' },
  { id: 'pirate-captain', name: 'Pirate Captain', image: '/action-figure-styles/pirate-captain.jpg' },
  { id: 'western-gunslinger', name: 'Western Gunslinger', image: '/action-figure-styles/western-gunslinger.jpg' },
  { id: 'viking-warrior', name: 'Viking Warrior', image: '/action-figure-styles/viking-warrior.jpg' },
  { id: 'samurai-master', name: 'Samurai Master', image: '/action-figure-styles/samurai-master.jpg' },
  { id: 'steampunk-inventor', name: 'Steampunk Inventor', image: '/action-figure-styles/steampunk-inventor.jpg' },
  { id: 'zombie-survivor', name: 'Zombie Survivor', image: '/action-figure-styles/zombie-survivor.jpg' },
  { id: 'alien-hunter', name: 'Alien Hunter', image: '/action-figure-styles/alien-hunter.jpg' },
  { id: 'magic-wizard', name: 'Magic Wizard', image: '/action-figure-styles/magic-wizard.jpg' },
  { id: 'sports-champion', name: 'Sports Champion', image: '/action-figure-styles/sports-champion.jpg' },
  { id: 'military-soldier', name: 'Military Soldier', image: '/action-figure-styles/military-soldier.jpg' },
  { id: 'retro-hero', name: 'Retro Hero', image: '/action-figure-styles/retro-hero.jpg' }
];

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
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'High-quality action figure generation',
    credits: 25,
    premium: true,
    supportsDualImage: false
  }
];

export const ACTION_FIGURE_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', description: 'Perfect for social media' },
  { value: '3:4', label: '3:4 (Portrait)', description: 'Classic action figure format' },
  { value: '4:5', label: '4:5 (Portrait)', description: 'Great for profile pictures' },
  { value: '16:9', label: '16:9 (Landscape)', description: 'Wide format' }
];

// Style prompts for different action figure types
export const ACTION_FIGURE_PROMPTS = {
  'superhero-classic': 'classic superhero action figure, heroic pose, bright colors, comic book style, collectible toy design',
  'marvel-hero': 'Marvel style superhero action figure, dynamic pose, detailed costume, movie-quality design',
  'dc-hero': 'DC Comics style superhero action figure, iconic costume, bold colors, premium collectible',
  'anime-figure': 'anime style action figure, detailed sculpting, vibrant colors, Japanese collectible style',
  'robot-mech': 'robot mech action figure, mechanical details, metallic finish, transformable design',
  'ninja-warrior': 'ninja warrior action figure, stealth pose, traditional outfit, weapon accessories',
  'space-marine': 'space marine action figure, futuristic armor, military pose, sci-fi weapons',
  'fantasy-knight': 'fantasy knight action figure, medieval armor, sword and shield, heroic stance',
  'cyberpunk-soldier': 'cyberpunk soldier action figure, neon accents, high-tech gear, dystopian design',
  'pirate-captain': 'pirate captain action figure, nautical costume, sword and treasure, adventure pose',
  'western-gunslinger': 'western gunslinger action figure, cowboy outfit, revolver, desert background',
  'viking-warrior': 'viking warrior action figure, fur and leather armor, battle axe, Norse design',
  'samurai-master': 'samurai master action figure, traditional armor, katana sword, honorable pose',
  'steampunk-inventor': 'steampunk inventor action figure, brass goggles, mechanical gadgets, Victorian style',
  'zombie-survivor': 'zombie survivor action figure, post-apocalyptic gear, weapons, gritty design',
  'alien-hunter': 'alien hunter action figure, space suit, plasma weapons, sci-fi design',
  'magic-wizard': 'magic wizard action figure, mystical robes, spell effects, fantasy staff',
  'sports-champion': 'sports champion action figure, athletic pose, team uniform, victory stance',
  'military-soldier': 'military soldier action figure, combat gear, realistic weapons, tactical pose',
  'retro-hero': 'retro hero action figure, vintage design, classic colors, nostalgic style'
};