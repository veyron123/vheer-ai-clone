// Pet Portrait Generator Constants
export const PET_PORTRAIT_STYLES = [
  { id: 'victorian-lady', name: 'Victorian Lady', image: '/Pet Portrait/il_1140xN.5140114168_k7vp.webp' },
  { id: 'elizabethan-queen', name: 'Elizabethan Queen', image: '/Pet Portrait/il_1140xN.6386808676_cs9x.webp' },
  { id: 'renaissance-noble', name: 'Renaissance Noble', image: '/Pet Portrait/videoframe_157.png' },
  { id: 'rococo-princess', name: 'Rococo Princess', image: '/Pet Portrait/videoframe_2512.png' },
  { id: 'baroque-duchess', name: 'Baroque Duchess', image: '/Pet Portrait/videoframe_4686.png' },
  { id: 'military-general', name: 'Military General', image: '/Pet Portrait/videoframe_7541.png' },
  { id: 'royal-portrait', name: 'Royal Portrait', image: '/Pet Portrait/videoframe_0.png' },
  { id: 'courtly-noble', name: 'Courtly Noble', image: '/Pet Portrait/videoframe_1249.png' },
  { id: 'aristocrat', name: 'Aristocrat', image: '/Pet Portrait/videoframe_2105.png' },
  { id: 'imperial-majesty', name: 'Imperial Majesty', image: '/Pet Portrait/videoframe_2729.png' },
  { id: 'medieval-lord', name: 'Medieval Lord', image: '/Pet Portrait/videoframe_3505.png' },
  { id: 'french-court', name: 'French Court', image: '/Pet Portrait/videoframe_3634.png' },
  { id: 'tudor-monarch', name: 'Tudor Monarch', image: '/Pet Portrait/videoframe_4281.png' },
  { id: 'spanish-grandee', name: 'Spanish Grandee', image: '/Pet Portrait/videoframe_5073.png' },
  { id: 'venetian-merchant', name: 'Venetian Merchant', image: '/Pet Portrait/videoframe_5430.png' },
  { id: 'georgian-gentleman', name: 'Georgian Gentleman', image: '/Pet Portrait/videoframe_5801.png' },
  { id: 'byzantine-emperor', name: 'Byzantine Emperor', image: '/Pet Portrait/videoframe_6553.png' },
  { id: 'ottoman-sultan', name: 'Ottoman Sultan', image: '/Pet Portrait/videoframe_6678.png' },
  { id: 'prussian-officer', name: 'Prussian Officer', image: '/Pet Portrait/videoframe_7377.png' },
  { id: 'habsburg-royal', name: 'Habsburg Royal', image: '/Pet Portrait/videoframe_8097.png' },
  { id: 'medici-patron', name: 'Medici Patron', image: '/Pet Portrait/videoframe_8620.png' },
  { id: 'bourbon-duke', name: 'Bourbon Duke', image: '/Pet Portrait/videoframe_8825.png' },
  { id: 'stuart-earl', name: 'Stuart Earl', image: '/Pet Portrait/videoframe_9442.png' },
  { id: 'hanover-prince', name: 'Hanover Prince', image: '/Pet Portrait/videoframe_9657.png' },
  { id: 'romanov-tsar', name: 'Romanov Tsar', image: '/Pet Portrait/videoframe_10599.png' }
];

export const PET_PORTRAIT_MODELS = [
  {
    id: 'nano-banana',
    name: 'Nano-Banana',
    description: 'Dual-image Pet Portrait generation with style transfer',
    credits: 20,
    premium: false,
    supportsDualImage: true
  }
  // Other models temporarily disabled until dual-image support is implemented
  // flux-pro, gpt-image, qwen-image - only support single image input
];

export const PET_PORTRAIT_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', description: 'Perfect for social media' },
  { value: '4:5', label: '4:5 (Portrait)', description: 'Great for profile pictures' },
  { value: '3:4', label: '3:4 (Portrait)', description: 'Classic portrait format' },
  { value: '16:9', label: '16:9 (Landscape)', description: 'Wide format' }
];