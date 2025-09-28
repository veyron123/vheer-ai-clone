// AI Models Configuration for Halloween Generator
export const HALLOWEEN_AI_MODELS = {
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux Pro',
    badge: { text: 'Fast', color: 'bg-yellow-400 text-black' },
    credits: 10
  },
  QWEN_IMAGE: {
    id: 'qwen-image',
    name: 'Qwen Image',
    badge: { text: 'NEW', color: 'bg-green-500 text-white' },
    credits: 20
  },
  SEEDREAM_V4: {
    id: 'seedream-v4',
    name: 'Seedream',
    badge: { text: 'HOT', color: 'bg-orange-500 text-white' },
    credits: 25
  }
};

export const HALLOWEEN_STYLES = [
  {
    id: 'corpse-bride',
    name: 'Corpse Bride',
    description: 'Tim Burton\'s gothic style with pale blue-grey skin and haunting beauty',
    image: '/halloween-styles/corpse-bride.webp',
    prompt: 'Corpse Bride transformation: pale blue-grey skin with realistic texture and subtle veins, large white expressive eyes with heavy dark circles, gothic makeup with dark purple lipstick, long flowing black hair with blue undertones, Victorian gothic dress with lace details, haunted melancholic expression, Tim Burton character design, dramatic lighting with cool blue tones, ethereal atmosphere, romantic gothic mood, high detail facial features, professional portrait lighting'
  },
  {
    id: 'dark-gothic',
    name: 'Dark Gothic',
    description: 'Mysterious dark gothic portrait with haunting atmosphere',
    image: '/halloween-styles/dark-gothic.png',
    prompt: 'Dark gothic transformation: porcelain pale skin with subtle texture details, dramatic black smoky eye makeup, blood red lips, mysterious intense gaze, black lace gothic dress, dark forest background with twisted bare trees, thick fog and mist effects, multiple candle flames casting warm light, volumetric lighting, gothic horror aesthetic, dark romantic atmosphere, professional photography, high contrast shadows, moody color grading'
  },
  {
    id: 'addams-family',
    name: 'Addams Family',
    description: 'Classic Addams Family gothic style with dark castle backdrop',
    image: '/halloween-styles/addams-family.png',
    prompt: 'Addams Family transformation: deathly pale white skin, dramatic gothic makeup with dark eyes, long straight black hair, elegant black Victorian dress with white collar, dark gothic castle background with towers and spires, stormy sky with dramatic clouds, candlelit atmosphere, formal portrait composition, mysterious aristocratic expression, gothic elegance, professional lighting, high detail textures'
  },
  {
    id: 'burton-family',
    name: 'Burton Family',
    description: 'Tim Burton\'s distinctive family portrait style with exaggerated features',
    image: '/halloween-styles/burton-family.png',
    prompt: 'Tim Burton transformation: exaggerated large white eyes with dark circles, pale blue-grey skin tone, elongated facial features, gothic Victorian clothing in black, candlelit gothic mansion interior, whimsical dark aesthetic, melancholic expressions, professional portrait lighting, high contrast, detailed textures, Burton character design style'
  },
  {
    id: 'witch-portrait',
    name: 'Halloween Witch',
    description: 'Traditional Halloween witch with warm autumn atmosphere',
    image: '/halloween-styles/witch-portrait.png',
    prompt: 'Halloween witch transformation: traditional black pointed witch hat with buckle, warm orange makeup with dramatic eyes, long wavy blonde hair, friendly mysterious smile, autumn forest background with glowing Jack-o-lanterns, harvest moon lighting, flying bats silhouettes, warm golden hour lighting, cozy Halloween atmosphere, traditional witch costume with cape, professional fantasy portrait, high detail textures'
  },
  {
    id: 'spooky-family',
    name: 'Spooky Family',
    description: 'Tim Burton style spooky family portrait with large white eyes',
    image: '/halloween-styles/spooky-family.webp',
    prompt: 'Spooky transformation: extremely large white eyes with heavy dark circles, pale grey-white skin, elongated limbs and features, dark Victorian gothic clothing, misty forest background with twisted trees, melancholic expressions, Tim Burton aesthetic, volumetric fog effects, professional lighting, high contrast shadows, detailed character design'
  },
  {
    id: 'gothic-manor',
    name: 'Gothic Manor Family',
    description: 'Elegant gothic family in aristocratic manor setting',
    image: '/halloween-styles/gothic-manor.webp',
    prompt: 'Gothic manor transformation: aristocratic pale skin, large distinctive white eyes, elegant Victorian black dresses and suits, ornate gothic mansion interior with chandelier, portrait composition on grand staircase, mysterious expressions, candlelit ambiance, professional studio lighting, high detail textures, dark romantic atmosphere, gothic elegance'
  },
  {
    id: 'frankenstein-couple',
    name: 'Frankenstein Couple',
    description: 'Classic monster couple in vintage horror style',
    image: '/halloween-styles/frankenstein-couple.png',
    prompt: 'Frankenstein transformation: green skin with realistic texture and visible stitches, neck bolts and scars, classic 1930s monster makeup, cemetery background with tombstones, full moon lighting, vintage horror aesthetic, dramatic shadows, professional horror photography, high detail prosthetic effects, gothic romance atmosphere'
  },
  {
    id: 'victorian-gothic',
    name: 'Victorian Gothic Family',
    description: 'Elegant Victorian era gothic family portrait',
    image: '/halloween-styles/victorian-gothic.png',
    prompt: 'Victorian gothic transformation: porcelain pale skin, haunting large dark eyes, elegant Victorian mourning dresses in black, ornate gothic interior with candelabras, formal portrait composition, mysterious expressions, candlelit lighting, professional vintage photography, high detail lace and fabric textures, dark romantic Victorian aesthetic'
  },
  {
    id: 'modern-gothic-couple',
    name: 'Modern Gothic Couple',
    description: 'Contemporary gothic couple with beloved pets',
    image: '/halloween-styles/modern-gothic-couple.png',
    prompt: 'Modern gothic couple transformation: pale skin with contemporary gothic makeup, dark dramatic eyes, alternative black clothing, cozy candlelit room interior, modern gothic lifestyle aesthetic, professional photography, high detail textures, contemporary dark romantic atmosphere'
  },
  {
    id: 'morticia-gothic',
    name: 'Morticia Style',
    description: 'Sophisticated gothic elegance inspired by Morticia Addams',
    image: '/halloween-styles/morticia-gothic.png',
    prompt: 'Morticia gothic transformation: long straight black hair, deathly pale white skin, dramatic dark eye makeup, elegant black Victorian dress with lace, gothic castle interior background, arched windows with candlelight, sophisticated mysterious expression, professional glamour lighting, high detail textures, classic gothic beauty, haunting aristocratic elegance'
  },
  {
    id: 'hotel-transylvania',
    name: 'Hotel Transylvania',
    description: 'Hotel Transylvania monster family style with Dracula and friends',
    image: '/halloween-styles/hotel-transylvania.webp',
    prompt: 'Hotel Transylvania transformation: monster family in Dracula castle, vampire dad with pale skin and fangs, mummy child with big eyes, werewolf dad with fur, green monster dog, gothic castle interior with candles and chandeliers, Halloween party atmosphere, Pixar 3D animation style, colorful monster family, spooky but friendly monsters, professional 3D rendering, high detail character design, fun Halloween family portrait'
  },
  {
    id: 'pixar-halloween',
    name: '3D Halloween Pixar',
    description: 'Pixar 3D Halloween style with cute monster family',
    image: '/halloween-styles/pixar-halloween.webp',
    prompt: '3D Halloween Pixar transformation: cute monster family in 3D Pixar style, mummy child with big blue eyes, vampire mom with fangs, werewolf dad with fur, golden retriever dog, Halloween night scene with full moon, jack-o-lanterns and flying bats, cozy Halloween atmosphere, Pixar character design, 3D animated movie style, warm golden lighting, friendly monster expressions, high detail 3D modeling, colorful Halloween scene'
  },
  {
    id: 'pixar-luca',
    name: 'Pixar\'s Luca Halloween',
    description: 'Luca style sea monsters in Halloween celebration',
    image: '/halloween-styles/luca-halloween.webp',
    prompt: 'Luca Halloween transformation: sea monster family in Luca Pixar style, dad as sea monster with tentacles and horns, mom as sea monster with fins, child with big curious eyes, golden retriever dog, Halloween celebration in Italian coastal town, underwater magic effects, Pixar 3D animation, colorful sea monster family, Halloween night atmosphere, full moon and jack-o-lanterns, warm Mediterranean Halloween, professional 3D character design, fun family Halloween portrait'
  }
];
