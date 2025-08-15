import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enProfile from '../locales/en/profile.json';
import enAuth from '../locales/en/auth.json';
import enGenerate from '../locales/en/generate.json';
import enPricing from '../locales/en/pricing.json';
import enTerms from '../locales/en/terms.json';
import enPrivacy from '../locales/en/privacy.json';
import enCookies from '../locales/en/cookies.json';
import enContact from '../locales/en/contact.json';

import ukCommon from '../locales/uk/common.json';
import ukHome from '../locales/uk/home.json';
import ukProfile from '../locales/uk/profile.json';
import ukAuth from '../locales/uk/auth.json';
import ukGenerate from '../locales/uk/generate.json';
import ukPricing from '../locales/uk/pricing.json';
import ukTerms from '../locales/uk/terms.json';
import ukPrivacy from '../locales/uk/privacy.json';
import ukCookies from '../locales/uk/cookies.json';
import ukContact from '../locales/uk/contact.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    profile: enProfile,
    auth: enAuth,
    generate: enGenerate,
    pricing: enPricing,
    terms: enTerms,
    privacy: enPrivacy,
    cookies: enCookies,
    contact: enContact,
  },
  uk: {
    common: ukCommon,
    home: ukHome,
    profile: ukProfile,
    auth: ukAuth,
    generate: ukGenerate,
    pricing: ukPricing,
    terms: ukTerms,
    privacy: ukPrivacy,
    cookies: ukCookies,
    contact: ukContact,
  },
};

// Language detection options
const detection = {
  // Order of detection methods
  order: ['path', 'localStorage', 'navigator', 'htmlTag'],
  
  // Keys to lookup language from path
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  
  // Cache language in localStorage
  caches: ['localStorage'],
  
  // Exclude certain paths from detection
  excludeCacheFor: ['cimode'],
  
  // Check if language is supported
  checkWhitelist: true,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'uk'],
    
    // Don't load default namespace
    defaultNS: 'common',
    
    // Language detection
    detection,
    
    // Debugging (set to false in production)
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // React specific options
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to get current language from URL
export const getLanguageFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (['en', 'uk'].includes(firstSegment)) {
    return firstSegment;
  }
  
  return 'en'; // default
};

// Helper function to get path without language prefix
export const getPathWithoutLanguage = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (['en', 'uk'].includes(firstSegment)) {
    return '/' + segments.slice(1).join('/');
  }
  
  return pathname;
};

// Helper function to add language prefix to path
export const addLanguageToPath = (path, language) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/${language}/${cleanPath}`.replace(/\/+$/, '') || `/${language}`;
};