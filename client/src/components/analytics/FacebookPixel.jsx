import React, { useEffect } from "react";

// Facebook Pixel component for tracking conversions
const FacebookPixel = () => {
  useEffect(() => {
    // Skip in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Facebook Pixel: Skipping initialization in development mode');
      return;
    }

    // Check if our pixel is already initialized to avoid conflicts
    if (window.fbq && window.fbq.pixelId === "1306490273852955") {
      console.log('Facebook Pixel: Already initialized');
      return;
    }

    // Load Facebook Pixel script
    const loadFacebookPixel = () => {
      // Create a unique namespace for our pixel
      const pixelNamespace = 'colibrrri_pixel';
      
      // Initialize Facebook Pixel with unique namespace
      window.fbq = function() {
        window.fbq.callMethod
          ? window.fbq.callMethod.apply(window.fbq, arguments)
          : (window.fbq.queue = window.fbq.queue || []).push(arguments);
      };
      
      // Initialize _fbq object with unique namespace
      window._fbq = window._fbq || {};
      window._fbq[pixelNamespace] = {
        loaded: true,
        version: "2.0",
        queue: [],
        pixelId: "1306490273852955"
      };
      
      // Insert script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
      
      // Initialize Pixel with your ID only after script is loaded
      script.onload = () => {
        if (window.fbq) {
          // Track before init to avoid conflicts
          window.fbq('set', 'autoConfig', false, '1306490273852955');
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