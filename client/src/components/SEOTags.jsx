import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath, getPathWithoutLanguage } from '../i18n/config';

const SEOTags = ({ 
  title, 
  description, 
  keywords, 
  image = 'https://colibrrri.ai/og-image.jpg',
  type = 'website'
}) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  const currentLang = getLanguageFromPath(location.pathname) || 'en';
  const pathWithoutLang = getPathWithoutLanguage(location.pathname);
  
  // Base URL for the site
  const baseUrl = 'https://colibrrri.ai';
  
  // Generate hreflang URLs
  const languages = ['en', 'uk'];
  const hreflangs = languages.map(lang => ({
    lang,
    url: `${baseUrl}/${lang}${pathWithoutLang}`
  }));
  
  // Current page URL
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  // Canonical URL (always point to current language version)
  const canonicalUrl = currentUrl;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="language" content={currentLang} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang Tags */}
      {hreflangs.map(({ lang, url }) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={url}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}/en${pathWithoutLang}`}
      />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="СolibRRRi AI" />
      <meta property="og:locale" content={currentLang === 'en' ? 'en_US' : 'uk_UA'} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@colibrrri" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional Language Meta */}
      <meta httpEquiv="Content-Language" content={currentLang} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="theme-color" content="#fbbf24" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="СolibRRRi" />
      <meta name="application-name" content="СolibRRRi" />
      <meta name="msapplication-TileColor" content="#fbbf24" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "СolibRRRi AI Image Generator",
          "url": baseUrl,
          "description": description,
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free AI image generation with 100 credits on signup"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "2547",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Organization",
            "name": "СolibRRRi Team",
            "url": baseUrl
          },
          "inLanguage": currentLang,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${baseUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          },
          "screenshot": image,
          "featureList": [
            "AI Image Generation",
            "Text to Image",
            "Image to Image",
            "Anime Art Generator",
            "Style Transfer",
            "Multiple AI Models",
            "High Resolution Output"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOTags;