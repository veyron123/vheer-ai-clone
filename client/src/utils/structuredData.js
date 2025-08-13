export const getGeneratorStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Vheer AI Anime Generator",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "AI-powered image generator that transforms photos into anime, cartoon, and artistic styles",
  "featureList": [
    "Disney style transformation",
    "Pixar style generation",
    "Manga and anime conversion",
    "Multiple AI models (Flux Pro, Flux Max, GPT Image)",
    "Custom aspect ratios",
    "High-quality output",
    "Fast generation",
    "Free to try"
  ],
  "screenshot": [
    {
      "@type": "ImageObject",
      "url": "https://vheer.ai/screenshots/anime-generator.jpg",
      "caption": "Transform photos to anime"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  }
});

export const getImageStructuredData = (imageUrl, description) => ({
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "url": imageUrl,
  "description": description,
  "creator": {
    "@type": "Organization",
    "name": "Vheer AI"
  },
  "copyrightHolder": {
    "@type": "Organization",
    "name": "Vheer AI"
  },
  "license": "https://vheer.ai/terms"
});

export const getFAQStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does Vheer AI anime generator work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vheer AI uses advanced artificial intelligence models including Flux Pro, Flux Max, and GPT Image to transform your photos into anime and cartoon styles. Simply upload a photo, select a style, and our AI will generate a stunning artistic version."
      }
    },
    {
      "@type": "Question",
      "name": "Is Vheer AI free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Vheer AI offers free generations with our basic models. Premium features and higher quality outputs are available with paid plans."
      }
    },
    {
      "@type": "Question",
      "name": "What styles are available in Vheer AI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vheer AI offers 16+ artistic styles including Disney, Pixar, DC Comics, Cyberpunk, Pop Art, Manga, Anime, Fantasy, and more. Each style uses specialized AI training to achieve authentic results."
      }
    },
    {
      "@type": "Question",
      "name": "What image formats does Vheer AI support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vheer AI supports common image formats including JPG, PNG, and WebP. The maximum file size is 10MB, and we support various aspect ratios including square, landscape, and portrait."
      }
    }
  ]
});

export const getBreadcrumbStructuredData = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});