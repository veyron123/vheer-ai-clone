import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, User } from 'lucide-react';
import SEOTags from '../components/SEOTags';
import { getLanguageFromPath } from '../i18n/config';

const ContactPage = () => {
  const { t } = useTranslation('contact');
  const location = useLocation();
  
  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOTags
        title={`${t('title')} - СolibRRRi`}
        description="Зв'яжіться з командою СolibRRRi. Ми готові допомогти з питаннями про AI генерацію зображень, технічною підтримкою та іншими запитами."
        keywords="контакти, підтримка, СolibRRRi, AI генерація зображень, технічна підтримка"
      />
      
      <div className="container-custom py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Contact Information Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Address Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">{t('office_info.address.title')}</h3>
              </div>
              <div className="text-gray-600 space-y-1">
                {t('office_info.address.lines', { returnObjects: true }).map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">Пошта</h3>
              </div>
              <div className="text-gray-600">
                <a 
                  href={`mailto:${t('office_info.contact_details.email')}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {t('office_info.contact_details.email')}
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">Телефон</h3>
              </div>
              <div className="text-gray-600">
                <a 
                  href={`tel:${t('office_info.contact_details.phone')}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {t('office_info.contact_details.phone')}
                </a>
              </div>
            </div>
          </div>

          {/* Business Entity & Support Hours */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Business Entity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">Юридична інформація</h3>
              </div>
              <div className="text-gray-600">
                <p className="font-medium">{t('office_info.contact_details.entity')}</p>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold ml-4">{t('office_info.hours.title')}</h3>
              </div>
              <div className="text-gray-600 space-y-2">
                <p>{t('office_info.hours.weekdays')}</p>
                <p>{t('office_info.hours.weekend')}</p>
                <p className="text-sm text-gray-500 mt-3">{t('office_info.hours.note')}</p>
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t('contact_methods.title')}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Support */}
              <div className="text-center p-6 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('contact_methods.email.title')}</h3>
                <p className="text-gray-600 text-sm mb-4">{t('contact_methods.email.description')}</p>
                <a 
                  href={`mailto:${t('contact_methods.email.address')}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {t('contact_methods.email.button')}
                </a>
              </div>

              {/* Business Inquiries */}
              <div className="text-center p-6 rounded-lg border border-gray-100 hover:border-green-200 transition-colors">
                <User className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('contact_methods.business.title')}</h3>
                <p className="text-gray-600 text-sm mb-4">{t('contact_methods.business.description')}</p>
                <a 
                  href={`mailto:${t('contact_methods.business.address')}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  {t('contact_methods.business.button')}
                </a>
              </div>

              {/* Privacy & Data */}
              <div className="text-center p-6 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('contact_methods.privacy.title')}</h3>
                <p className="text-gray-600 text-sm mb-4">{t('contact_methods.privacy.description')}</p>
                <a 
                  href={`mailto:${t('contact_methods.privacy.address')}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  {t('contact_methods.privacy.button')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;