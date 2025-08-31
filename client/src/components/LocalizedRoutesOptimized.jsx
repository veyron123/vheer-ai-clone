import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath, addLanguageToPath } from '../i18n/config';
import { useAuthStore } from '../stores/authStore';

// Loading component for lazy loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

// Lazy load all pages for better performance
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const CookiesPage = lazy(() => import('../pages/CookiesPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AuthCallback = lazy(() => import('../pages/AuthCallback'));
const AnimeGeneratorPage = lazy(() => import('../pages/AnimeGeneratorPage'));
const ImageToImageGeneratorPage = lazy(() => import('../pages/ImageToImageGeneratorPage'));
const StyleTransferPage = lazy(() => import('../pages/StyleTransferPage'));
const PetPortraitGeneratorPage = lazy(() => import('../pages/PetPortraitGeneratorPage'));
const TextToImageGeneratorPage = lazy(() => import('../pages/TextToImageGeneratorPage'));
const RunwayVideoGeneratorPage = lazy(() => import('../pages/RunwayVideoGeneratorPage'));
const MockupGeneratorPage = lazy(() => import('../pages/MockupGeneratorPage'));
const MockupLibraryPage = lazy(() => import('../pages/MockupLibraryPage'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('../pages/PaymentFailure'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Language-prefixed routes */}
        <Route path="/:lang/*" element={<LanguageRoutes />} />
        
        {/* Payment redirect handlers - redirect to language-prefixed routes */}
        <Route path="/payment/success" element={<Navigate to={`/${i18n.language || 'en'}/payment/success${location.search}`} replace />} />
        <Route path="/payment/failure" element={<Navigate to={`/${i18n.language || 'en'}/payment/failure${location.search}`} replace />} />
        <Route path="/payment/fail" element={<Navigate to={`/${i18n.language || 'en'}/payment/failure${location.search}`} replace />} />
        
        {/* Fallback redirects */}
        <Route path="*" element={<Navigate to="/en/" replace />} />
      </Routes>
    </Suspense>
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
      <Route path="/image-style-transfer" element={<StyleTransferPage />} />
      <Route path="/pet-portrait-generator" element={<PetPortraitGeneratorPage />} />
      <Route path="/text-to-image-generator" element={<TextToImageGeneratorPage />} />
      <Route path="/ai-video-generator" element={<RunwayVideoGeneratorPage />} />
      <Route path="/mockup-generator" element={<MockupGeneratorPage />} />
      
      {/* Mockup pages */}
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
      
      {/* Admin route - only for admin users */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default LocalizedRoutes;