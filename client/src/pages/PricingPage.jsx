import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Building } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath } from '../i18n/config';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const PricingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation('pricing');
  
  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  const { data: plans } = useQuery('plans', () =>
    api.get('/subscriptions/plans').then(res => res.data)
  );

  const planIcons = {
    FREE: Sparkles,
    BASIC: Zap,
    PRO: Crown,
    ENTERPRISE: Building
  };

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
    } else if (plan.id !== 'FREE') {
      // Navigate to payment page
      toast.info('Payment integration coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans?.map((plan, index) => {
            const Icon = planIcons[plan.id];
            const isPopular = plan.id === 'PRO';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${isPopular ? 'scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('mostPopular')}
                    </span>
                  </div>
                )}
                
                <div className={`card p-8 h-full flex flex-col ${isPopular ? 'ring-2 ring-primary-500' : ''}`}>
                  {/* Plan Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    plan.id === 'FREE' ? 'bg-gray-100 text-gray-600' :
                    plan.id === 'BASIC' ? 'bg-blue-100 text-blue-600' :
                    plan.id === 'PRO' ? 'bg-primary-100 text-primary-600' :
                    'bg-primary-100 text-primary-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">
                    {t(`plans.${plan.id.toLowerCase()}.name`)}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {plan.currency || '₴'}{plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/{t('perMonth').replace('per ', '').replace('на ', '')}</span>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="mb-6 pb-6 border-b">
                    <p className="text-lg font-medium">
                      {plan.credits} {t('credits')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {plan.id === 'FREE' ? t('perDay') : t('perMonth')}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {t(`plans.${plan.id.toLowerCase()}.features`, { returnObjects: true }).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 rounded-lg font-medium transition mt-auto ${
                      plan.id === 'FREE' 
                        ? 'btn btn-outline'
                        : isPopular
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }`}
                  >
                    {plan.id === 'FREE' ? t('getStarted') : t('upgradeNow')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('faq.title')}
          </h2>
          
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-2">{t('faq.questions.whatAreCredits.question')}</h3>
              <p className="text-gray-600">
                {t('faq.questions.whatAreCredits.answer')}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">{t('faq.questions.changePlan.question')}</h3>
              <p className="text-gray-600">
                {t('faq.questions.changePlan.answer')}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">{t('faq.questions.rollOver.question')}</h3>
              <p className="text-gray-600">
                {t('faq.questions.rollOver.answer')}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">{t('faq.questions.freeTrial.question')}</h3>
              <p className="text-gray-600">
                {t('faq.questions.freeTrial.answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;