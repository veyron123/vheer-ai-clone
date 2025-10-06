import React, { useEffect } from "react";

// Facebook Pixel component for tracking conversions
const FacebookPixel = () => {
  useEffect(() => {
    // Skip in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Facebook Pixel: Skipping initialization in development mode');
      return;
    }

    // Check if pixel is already loaded to avoid conflicts
    if (window.fbq && window.fbq.loaded) {
      console.log('Facebook Pixel: Already initialized');
      return;
    }

    // Load Facebook Pixel script
    const loadFacebookPixel = () => {
      // Clear any existing pixel to avoid conflicts
      if (window.fbq) {
        delete window.fbq;
      }
      
      // Clear any existing _fbq to avoid conflicts
      if (window._fbq) {
        delete window._fbq;
      }
      
      // Initialize Facebook Pixel
      window.fbq = function() {
        window.fbq.callMethod
          ? window.fbq.callMethod.apply(window.fbq, arguments)
          : (window.fbq.queue = window.fbq.queue || []).push(arguments);
      };
      
      // Initialize _fbq object
      window._fbq = {
        loaded: true,
        version: "2.0",
        queue: []
      };
      
      // Insert script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
      
      // Initialize Pixel with your ID only after script is loaded
      script.onload = () => {
        if (window.fbq) {
          window.fbq("init", "1306490273852955");
          window.fbq("track", "PageView");
          console.log('Facebook Pixel: Initialized successfully');
        }
      };
      
      // Handle script loading errors
      script.onerror = () => {
        console.error('Facebook Pixel: Failed to load script');
      };
    };

    // Load Facebook Pixel
    loadFacebookPixel();
  }, []);

  return null;
};

export default FacebookPixel;