import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath, addLanguageToPath } from '../i18n/config';
import { useAuthStore } from '../stores/authStore';

// Import pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import PricingPage from '../pages/PricingPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import CookiesPage from '../pages/CookiesPage';
import ContactPage from '../pages/ContactPage';
import AuthCallback from '../pages/AuthCallback';
import AnimeGeneratorPage from '../pages/AnimeGeneratorPage';
import ImageToImageGeneratorPage from '../pages/ImageToImageGeneratorPage';
import StyleTransferPage from '../pages/StyleTransferPage';
import MockupCanvasPage from '../pages/MockupCanvasPage';
import MockupCSSPage from '../pages/MockupCSSPage';
import MockupLibraryPage from '../pages/MockupLibraryPage';
import MockupTestPage from '../pages/MockupTestPage';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFailure from '../pages/PaymentFailure';

const LocalizedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // Handle root path redirect
  useEffect(() => {
    const currentLang = getLanguageFromPath(location.pathname);
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // If we're at root path, redirect to default language
    if (location.pathname === '/') {
      const defaultLang = i18n.language || 'en';
      navigate(`/${defaultLang}/`, { replace: true });
      return;
    }
    
    // If path doesn't start with language code, add it
    if (!['en', 'uk'].includes(pathSegments[0])) {
      const defaultLang = i18n.language || 'en';
      const newPath = addLanguageToPath(location.pathname, defaultLang);
      navigate(newPath, { replace: true });
      return;
    }
    
    // Update i18n language if different
    if (currentLang !== i18n.language) {
      i18n.changeLanguage(currentLang);
    }
  }, [location.pathname, i18n, navigate]);

  return (
    <Routes>
      {/* Language-prefixed routes */}
      <Route path="/:lang/*" element={<LanguageRoutes />} />
      
      {/* Fallback redirects */}
      <Route path="*" element={<Navigate to="/en/" replace />} />
    </Routes>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const currentLang = getLanguageFromPath(window.location.pathname) || 'en';
  
  if (!isAuthenticated) {
    return <Navigate to={`/${currentLang}/login`} replace />;
  }
  
  return children;
};

const LanguageRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/anime-generator" element={<AnimeGeneratorPage />} />
      <Route path="/image-to-image-generator" element={<ImageToImageGeneratorPage />} />
      <Route path="/generate" element={<StyleTransferPage />} />
      
      {/* Mockup test pages */}
      <Route path="/mockup-test" element={<MockupTestPage />} />
      <Route path="/mockup-canvas" element={<MockupCanvasPage />} />
      <Route path="/mockup-css" element={<MockupCSSPage />} />
      <Route path="/mockup-library" element={<MockupLibraryPage />} />
      
      {/* Auth routes */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Payment routes */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />
      
      {/* Protected routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default LocalizedRoutes;