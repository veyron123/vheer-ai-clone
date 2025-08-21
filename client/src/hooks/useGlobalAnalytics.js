/**
 * 🎯 Global Analytics Hook for ColibRRRi AI
 * Initializes and manages analytics throughout the application lifecycle
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import analytics from '../services/analytics';

export const useGlobalAnalytics = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // 🔄 Track page views on route changes
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    
    analytics.pageViewed(pageName, {
      path: location.pathname,
      search: location.search,
      user_authenticated: isAuthenticated
    });
  }, [location, isAuthenticated]);

  // 👤 Set user properties when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      analytics.setUserProperties({
        user_id: user.id,
        user_type: user.subscription?.plan || 'FREE',
        subscription_status: user.subscription?.status || 'FREE',
        total_credits: user.totalCredits || 0,
        user_since: user.createdAt,
        language: navigator.language || 'en'
      });

      // Store user creation date for tenure calculation
      if (!localStorage.getItem('user_created_at')) {
        localStorage.setItem('user_created_at', user.createdAt);
      }
    }
  }, [user, isAuthenticated]);

  // 📱 Track session start/end
  useEffect(() => {
    const sessionStartTime = Date.now();
    analytics.sessionStart();

    // Track performance metrics
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        analytics.performanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        analytics.performanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      }
    }

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartTime;
      analytics.sessionEnd(sessionDuration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const sessionDuration = Date.now() - sessionStartTime;
      analytics.sessionEnd(sessionDuration);
    };
  }, []);

  // 🎯 Track feature usage based on current page
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    
    if (pageName !== 'unknown') {
      analytics.featureUsed('page_visit', {
        page_name: pageName,
        timestamp: Date.now()
      });
    }
  }, [location.pathname]);

  return {
    analytics,
    trackCustomEvent: analytics.track.bind(analytics)
  };
};

// 🗺️ Helper function to get readable page names
function getPageName(pathname) {
  // Remove language prefix
  const cleanPath = pathname.replace(/^\/(en|uk)/, '');
  
  const pageMap = {
    '/': 'home',
    '/generate': 'ai_generator',
    '/anime': 'anime_generator', 
    '/image-to-image': 'image_to_image',
    '/style-transfer': 'style_transfer',
    '/gallery': 'gallery',
    '/pricing': 'pricing',
    '/profile': 'profile',
    '/login': 'login',
    '/register': 'register',
    '/contact': 'contact',
    '/privacy': 'privacy',
    '/terms': 'terms',
    '/cookies': 'cookies',
    '/payment-success': 'payment_success',
    '/payment-failure': 'payment_failure'
  };

  return pageMap[cleanPath] || 'unknown';
}

export default useGlobalAnalytics;