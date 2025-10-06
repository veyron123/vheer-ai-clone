import React, { useEffect } from "react";

// Facebook Pixel component for tracking conversions
const FacebookPixel = () => {
  useEffect(() => {
    // Load Facebook Pixel script
    const loadFacebookPixel = () => {
      // Initialize Facebook Pixel
      window.fbq = function() {
        window.fbq.callMethod 
          ? window.fbq.callMethod.apply(window.fbq, arguments) 
          : window.fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = {};
      window._fbq.push = window._fbq.loaded ? 0 : 1;
      window._fbq.loaded = true;
      window._fbq.version = "2.0";
      window._fbq.queue = [];
      
      // Insert script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
      
      // Initialize Pixel with your ID
      window.fbq("init", "1306490273852955");
      window.fbq("track", "PageView");
    };

    // Check if fbq is already loaded
    if (!window.fbq) {
      loadFacebookPixel();
    }
  }, []);

  return null;
};

export default FacebookPixel;