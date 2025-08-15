import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { addLanguageToPath, getPathWithoutLanguage } from '../i18n/config';

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n, t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇺🇸' },
    { code: 'uk', name: t('languages.uk'), flag: '🇺🇦' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    if (langCode === i18n.language) return;

    // Get path without current language prefix
    const pathWithoutLang = getPathWithoutLanguage(location.pathname);
    
    // Add new language prefix
    const newPath = addLanguageToPath(pathWithoutLang, langCode);
    
    // Change language in i18next
    i18n.changeLanguage(langCode);
    
    // Navigate to new path
    navigate(newPath, { replace: true });
  };

  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
      </button>
      
      <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible transition-all duration-200 z-50">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
              language.code === i18n.language
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-700'
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
            {language.code === i18n.language && (
              <span className="ml-auto text-primary-600">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;