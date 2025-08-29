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
import analytics from '../services/analytics';

const PricingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useTranslation('pricing');
  
  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  // Temporary fallback data in case API is not available
  const fallbackPlans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      currency: currentLang === 'uk' ? '₴' : '$',
      credits: 100,
      features: []
    },
    {
      id: 'BASIC',
      name: 'Basic',
      price: 1,
      currency: '₴',
      credits: 800,
      features: []
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: currentLang === 'uk' ? 1200 : 30,
      currency: currentLang === 'uk' ? '₴' : '$',
      credits: 3000,
      features: []
    },
    {
      id: 'ENTERPRISE',
      name: 'Maximum',
      price: currentLang === 'uk' ? 4000 : 99,
      currency: currentLang === 'uk' ? '₴' : '$',
      credits: 15000,
      features: []
    }
  ];

  const { data: plans, error, isLoading } = useQuery(
    ['plans', currentLang], 
    () => api.get(`/subscriptions/plans?lang=${currentLang}`).then(res => res.data),
    {
      retry: 2,
      onError: (error) => {
        console.error('Error fetching plans:', error);
      }
    }
  );

  // Use fallback data if API fails
  const displayPlans = plans || fallbackPlans;

  const planIcons = {
    FREE: Sparkles,
    BASIC: Zap,
    PRO: Crown,
    ENTERPRISE: Building
  };

  // Plan hierarchy for comparison (lower index = lower tier)
  const planHierarchy = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  
  // Get current user plan
  const currentUserPlan = user?.subscription?.plan || 'FREE';
  const currentUserPlanIndex = planHierarchy.indexOf(currentUserPlan);
  
  // Function to determine button state and text
  const getButtonConfig = (plan) => {
    const planIndex = planHierarchy.indexOf(plan.id);
    
    if (plan.id === 'FREE') {
      return {
        text: t('getStarted'),
        disabled: false,
        className: 'btn btn-outline',
        onClick: () => handleSelectPlan(plan)
      };
    }
    
    if (plan.id === currentUserPlan) {
      return {
        text: t('currentPlan'),
        disabled: true,
        className: 'btn btn-outline opacity-60 cursor-not-allowed',
        onClick: () => {}
      };
    }
    
    if (planIndex > currentUserPlanIndex) {
      // Higher tier plan - can upgrade (but may show popup if active subscription)
      return {
        text: t('upgradeNow'),
        disabled: false,
        className: `btn ${plan.id === 'PRO' ? 'btn-primary' : 'btn-secondary'}`,
        onClick: () => handleSelectPlan(plan)
      };
    } else {
      // Lower tier plan - cannot downgrade during active subscription
      const isActiveSubscription = user?.subscription?.status === 'ACTIVE' && currentUserPlan !== 'FREE';
      return {
        text: isActiveSubscription ? t('downgradeLocked') : t('subscribeNow'),
        disabled: isActiveSubscription,
        className: isActiveSubscription 
          ? 'btn btn-outline opacity-50 cursor-not-allowed'
          : 'btn btn-secondary',
        onClick: isActiveSubscription ? () => {} : () => handleSelectPlan(plan)
      };
    }
  };

  const handleSelectPlan = async (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    // Check if user is trying to upgrade while having an active subscription
    const hasActiveSubscription = user?.subscription?.status === 'ACTIVE' && currentUserPlan !== 'FREE';
    const planIndex = planHierarchy.indexOf(plan.id);
    const isUpgrade = planIndex > currentUserPlanIndex;
    
    if (hasActiveSubscription && isUpgrade) {
      // Show popup message about cancelling current subscription first
      toast.error(t('upgradeRequiresCancellation'), {
        duration: 6000,
        style: {
          maxWidth: '400px',
        }
      });
      return;
    }
    
    if (plan.id !== 'FREE') {
      // 📊 Track subscription view
      analytics.subscriptionViewed(plan.id);

      // 📊 Track subscription attempt
      analytics.track('begin_checkout', {
        currency: 'UAH',
        value: plan.price,
        items: [{
          item_id: plan.id,
          item_name: `${plan.name} Subscription`,
          price: plan.price,
          quantity: 1
        }]
      });

      try {
        // Initialize payment through API to pass user context
        const response = await api.post('/payments/wayforpay/init', {
          planId: plan.id,
          language: currentLang
        });

        if (response.data.success && response.data.paymentData) {
          // Create a form and submit it to WayForPay
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = 'https://secure.wayforpay.com/pay';
          form.acceptCharset = 'utf-8';

          // Add all payment data as hidden fields
          Object.keys(response.data.paymentData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            
            // Handle arrays properly
            if (Array.isArray(response.data.paymentData[key])) {
              input.value = response.data.paymentData[key][0];
            } else {
              input.value = response.data.paymentData[key];
            }
            
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
        } else if (response.data.buttonUrl) {
          // Fallback to button URL if form data not available
          window.location.href = response.data.buttonUrl;
        } else {
          throw new Error('No payment URL available');
        }
      } catch (error) {
        console.error('Payment initialization error:', error);
        
        // Fallback to static button URLs if API fails
        const paymentUrl = displayPlans.find(p => p.id === plan.id)?.paymentUrl;
        
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          const fallbackUrls = currentLang === 'uk' ? {
            BASIC: 'https://secure.wayforpay.com/button/bcdf0c219984e',
            PRO: 'https://secure.wayforpay.com/button/bc832264fe106',
            ENTERPRISE: 'https://secure.wayforpay.com/button/b8ad589698312'
          } : {
            BASIC: 'https://secure.wayforpay.com/button/b22dba93721e3',
            PRO: 'https://secure.wayforpay.com/button/bcb8a5a42c05f',
            ENTERPRISE: 'https://secure.wayforpay.com/button/bd36297803462'
          };
          
          if (fallbackUrls[plan.id]) {
            window.location.href = fallbackUrls[plan.id];
          } else {
            toast(currentLang === 'uk' ? 
              'URL оплати не налаштований для цього плану' : 
              'Payment URL not configured for this plan', 
              { icon: '⚠️' }
            );
          }
        }
      }
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

        {/* Debug info */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>API Error:</strong> {error.message}
            <br />
            <small>Using fallback data. Check network tab for details.</small>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {displayPlans?.map((plan, index) => {
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
                  {(() => {
                    const buttonConfig = getButtonConfig(plan);
                    return (
                      <button
                        onClick={buttonConfig.onClick}
                        disabled={buttonConfig.disabled}
                        className={`w-full py-3 rounded-lg font-medium transition mt-auto ${buttonConfig.className}`}
                        title={buttonConfig.disabled ? (plan.id === currentUserPlan ? t('currentPlan') : t('downgradeLocked')) : ''}
                      >
                        {buttonConfig.text}
                      </button>
                    );
                  })()}
                  
                  {/* Helpful message based on plan comparison */}
                  {(() => {
                    const planIndex = planHierarchy.indexOf(plan.id);
                    const isActiveSubscription = user?.subscription?.status === 'ACTIVE' && currentUserPlan !== 'FREE';
                    
                    if (plan.id === 'FREE') {
                      return null; // No message for FREE plan
                    }
                    
                    if (plan.id === currentUserPlan) {
                      return (
                        <p className="text-xs text-blue-600 text-center mt-2 font-medium">
                          ✓ {t('currentPlan')}
                        </p>
                      );
                    }
                    
                    if (planIndex > currentUserPlanIndex) {
                      return isActiveSubscription ? (
                        <p className="text-xs text-orange-600 text-center mt-2">
                          {t('cancelToUpgrade')}
                        </p>
                      ) : null;
                    } else if (isActiveSubscription) {
                      return (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          {t('canDowngradeAfterExpiry')}
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Auto-Renew. Cancel Anytime
                        </p>
                      );
                    }
                  })()}
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