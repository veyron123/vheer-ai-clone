import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs component for SEO and navigation
 * Implements Schema.org BreadcrumbList structured data
 */
const Breadcrumbs = ({ customItems = null }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Skip breadcrumbs on homepage
  if (pathnames.length === 0) return null;
  
  // Page name mapping for better display
  const pageNames = {
    'generate': 'Generate',
    'anime-generator': 'Anime Generator',
    'image-to-image': 'Image to Image',
    'style-transfer': 'Style Transfer',
    'gallery': 'Gallery',
    'pricing': 'Pricing',
    'profile': 'Profile',
    'login': 'Login',
    'register': 'Register',
    'about': 'About',
    'terms': 'Terms of Service',
    'privacy': 'Privacy Policy'
  };
  
  // Build breadcrumb items
  const breadcrumbItems = customItems || pathnames.map((path, index) => {
    const url = `/${pathnames.slice(0, index + 1).join('/')}`;
    const name = pageNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
    const isLast = index === pathnames.length - 1;
    
    return {
      name,
      url,
      isLast
    };
  });
  
  // Add home as first item
  const allItems = [
    { name: 'Home', url: '/', isLast: false },
    ...breadcrumbItems
  ];
  
  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://colibrrri.com${item.url}`
    }))
  };
  
  return (
    <>
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Visual Breadcrumbs */}
      <nav 
        aria-label="Breadcrumb"
        className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
      >
        <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
          {allItems.map((item, index) => (
            <li
              key={item.url}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
              
              {item.isLast ? (
                <span 
                  className="text-gray-900 font-medium"
                  itemProp="name"
                >
                  {item.name === 'Home' ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    item.name
                  )}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                  itemProp="item"
                >
                  <span itemProp="name">
                    {item.name === 'Home' ? (
                      <Home className="w-4 h-4" />
                    ) : (
                      item.name
                    )}
                  </span>
                </Link>
              )}
              
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;