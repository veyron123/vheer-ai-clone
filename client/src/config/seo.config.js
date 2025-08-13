export const SEO_CONFIG = {
  site: {
    name: 'Vheer AI',
    url: 'https://vheer.ai',
    logo: 'https://vheer.ai/logo.svg',
    favicon: '/favicon.ico',
    themeColor: '#6366f1',
    locale: 'en_US',
    twitter: '@vheerai',
  },
  
  defaults: {
    title: 'Vheer AI - Transform Photos into Stunning Anime Art | Free AI Image Generator',
    titleTemplate: '%s | Vheer AI',
    description: 'Transform your photos into amazing anime, cartoon and artistic styles using advanced AI models. Support for Disney, Pixar, Manga styles and more. Try Flux Pro, Flux Max, and GPT Image generators for free!',
    keywords: 'AI image generator, anime converter, photo to anime, cartoon filter, Disney style, Pixar style, manga creator, AI art generator, Flux Pro, GPT Image, free image generator',
    image: 'https://vheer.ai/og-image.jpg',
  },
  
  pages: {
    home: {
      title: 'Vheer AI - Transform Photos into Stunning Anime Art',
      description: 'Create amazing anime and cartoon art from your photos using advanced AI. Free to try with multiple artistic styles including Disney, Pixar, and Manga.',
      keywords: 'AI image generator, photo transformation, anime art creator, cartoon maker',
    },
    animeGenerator: {
      title: 'AI Anime Generator - Transform Photos to Anime Art',
      description: 'Convert your photos into stunning anime, Disney, Pixar, and manga styles instantly. Use advanced AI models including Flux Pro, Flux Max, and GPT Image.',
      keywords: 'anime generator, photo to anime, AI anime converter, Disney style generator, Pixar filter',
    },
    gallery: {
      title: 'AI Art Gallery - Stunning Anime & Cartoon Transformations',
      description: 'Explore amazing AI-generated anime and cartoon artwork. See examples of photo transformations using our advanced AI models.',
      keywords: 'AI art gallery, anime artwork, cartoon transformations, AI generated images',
    },
    pricing: {
      title: 'Pricing Plans - Affordable AI Image Generation',
      description: 'Choose the perfect plan for your AI image generation needs. Free tier available with premium features for professionals.',
      keywords: 'AI image generator pricing, subscription plans, free AI art generator',
    },
    login: {
      title: 'Login to Your Account',
      description: 'Access your Vheer AI account to continue creating amazing AI-generated artwork.',
      keywords: 'login, sign in, account access',
    },
    register: {
      title: 'Create Your Free Account',
      description: 'Sign up for Vheer AI and start transforming your photos into stunning anime and cartoon art.',
      keywords: 'sign up, register, create account, free account',
    },
  },
  
  social: {
    twitter: {
      card: 'summary_large_image',
      site: '@vheerai',
      creator: '@vheerai',
    },
    facebook: {
      appId: '',
    },
  },
  
  jsonLd: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Vheer AI',
      url: 'https://vheer.ai',
      logo: 'https://vheer.ai/logo.svg',
      sameAs: [
        'https://twitter.com/vheerai',
        'https://facebook.com/vheerai',
        'https://instagram.com/vheerai',
      ],
    },
  },
};

export const generateMetaTags = (page) => {
  const pageConfig = SEO_CONFIG.pages[page] || SEO_CONFIG.defaults;
  const siteConfig = SEO_CONFIG.site;
  
  return {
    title: pageConfig.title,
    description: pageConfig.description,
    keywords: pageConfig.keywords,
    canonical: `${siteConfig.url}/${page === 'home' ? '' : page}`,
    openGraph: {
      title: pageConfig.title,
      description: pageConfig.description,
      url: `${siteConfig.url}/${page === 'home' ? '' : page}`,
      siteName: siteConfig.name,
      image: SEO_CONFIG.defaults.image,
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: SEO_CONFIG.social.twitter.card,
      site: SEO_CONFIG.social.twitter.site,
      creator: SEO_CONFIG.social.twitter.creator,
      title: pageConfig.title,
      description: pageConfig.description,
      image: SEO_CONFIG.defaults.image,
    },
  };
};