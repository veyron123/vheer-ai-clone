import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title = 'СolibRRRi - AI Image Generation Platform',
  description = 'Create stunning AI-generated images with СolibRRRi. Transform your ideas into art using advanced AI models including Flux, Stable Diffusion, and more. Free credits on signup!',
  keywords = 'AI image generator, AI art, text to image, image generation, Flux AI, Stable Diffusion, anime art generator, AI portrait, free AI generator',
  image = '/og-image.jpg',
  url = 'https://colibrrri.com',
  type = 'website'
}) => {
  const siteTitle = title.includes('СolibRRRi') ? title : `${title} | СolibRRRi`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="СolibRRRi Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph Tags for Social Media */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="СolibRRRi" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@colibrrri" />
      <meta name="twitter:creator" content="@colibrrri" />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#fbbf24" />
      <link rel="canonical" href={url} />
      
      {/* Mobile App Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="СolibRRRi" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Helmet>
  );
};

export default SEOHead;