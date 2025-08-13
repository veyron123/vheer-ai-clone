import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'Vheer AI - Transform Photos into Stunning Anime Art',
  description = 'Transform your photos into amazing anime, cartoon and artistic styles using advanced AI models. Try Flux Pro, Flux Max, and GPT Image generators for free!',
  keywords = 'AI image generator, anime converter, photo to anime, cartoon filter, Disney style, Pixar style',
  image = 'https://vheer.ai/og-image.jpg',
  url = 'https://vheer.ai',
  type = 'website'
}) => {
  const siteTitle = title.includes('Vheer') ? title : `${title} | Vheer AI`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;