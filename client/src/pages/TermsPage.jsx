import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SEOTags from '../components/SEOTags';
import DebugTranslation from '../components/DebugTranslation';
import { getLanguageFromPath } from '../i18n/config';

const TermsPage = () => {
  const { t } = useTranslation('terms');
  const location = useLocation();
  
  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  const sections = [
    'useOfServices',
    'yourContent', 
    'aiGeneration',
    'prohibitedUse',
    'accountSecurity',
    'paymentTerms',
    'intellectualProperty',
    'disclaimers',
    'privacy',
    'termination',
    'changes',
    'refundPolicy',
    'governing',
    'contact'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugTranslation />
      <SEOTags
        title={`${t('title')} - СolibRRRi`}
        description="Read our terms and conditions for using СolibRRRi AI image generation services. Learn about your rights, our policies, and how we protect your data."
        keywords="terms of service, conditions, legal, privacy, AI image generation, СolibRRRi"
      />
      
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('effectiveDate')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 md:p-12">
              {/* Introduction */}
              <div className="mb-12">
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  <p className="mb-6">
                    {t('intro.welcome')}
                  </p>
                  <p className="mb-6">
                    {t('intro.incorporation')}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {sections.map((sectionKey) => (
                  <section key={sectionKey}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {t(`sections.${sectionKey}.title`)}
                    </h2>
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                      {t(`sections.${sectionKey}.content`).split('\n\n').map((paragraph, index) => (
                        <div key={index}>
                          {paragraph.includes('•') ? (
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                              {paragraph.split('\n•').slice(1).map((item, itemIndex) => (
                                <li key={itemIndex} className="text-gray-700">
                                  {item.trim()}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mb-6">
                              {paragraph}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  {t('lastUpdated')}
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <a
              href={`/${currentLang}/`}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              ← {currentLang === 'uk' ? 'Повернутися на головну' : 'Back to Home'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;