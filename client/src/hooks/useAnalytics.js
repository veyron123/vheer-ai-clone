
// 📊 Google Analytics хуки для ColibRRRi AI
import { useCallback } from 'react';

export const useAnalytics = () => {
  
  // 🎨 Отслеживание генерации изображения
  const trackImageGeneration = useCallback((data) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'image_generation_complete', {
        event_category: 'engagement',
        event_label: data.model || 'default',
        value: 1,
        custom_parameters: {
          ai_model: data.model,
          style: data.style,
          user_plan: data.userPlan || 'free',
          generation_time: data.generationTime
        }
      });
    }
  }, []);

  // 👤 Отслеживание регистрации
  const trackRegistration = useCallback((method = 'email') => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'user_registration', {
        event_category: 'acquisition',
        event_label: 'new_user', 
        value: 1,
        custom_parameters: {
          registration_method: method,
          referral_source: document.referrer || 'direct'
        }
      });
    }
  }, []);

  // 💰 Отслеживание покупки подписки
  const trackSubscriptionPurchase = useCallback((planData) => {
    if (typeof gtag !== 'undefined') {
      // Основное событие конверсии
      gtag('event', 'subscription_purchase', {
        event_category: 'conversion',
        event_label: planData.planType,
        value: planData.price,
        currency: 'USD',
        custom_parameters: {
          plan_type: planData.planType,
          billing_cycle: planData.billingCycle || 'monthly',
          payment_method: 'wayforpay'
        }
      });

      // Enhanced Ecommerce покупка
      gtag('event', 'purchase', {
        transaction_id: planData.orderId || Date.now().toString(),
        value: planData.price,
        currency: 'USD',
        items: [{
          item_id: planData.planType,
          item_name: `${planData.planType.charAt(0).toUpperCase() + planData.planType.slice(1)} Plan`,
          item_category: 'subscription',
          price: planData.price,
          quantity: 1
        }]
      });
    }
  }, []);

  // 🛒 Отслеживание начала оплаты
  const trackBeginCheckout = useCallback((planData) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: planData.price,
        items: [{
          item_id: planData.planType,
          item_name: `${planData.planType.charAt(0).toUpperCase() + planData.planType.slice(1)} Plan`,
          item_category: 'subscription',
          price: planData.price,
          quantity: 1
        }]
      });
    }
  }, []);

  // 🎯 Отслеживание первой генерации
  const trackFirstGeneration = useCallback((userId) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'first_generation', {
        event_category: 'activation',
        event_label: 'new_user_activated',
        value: 1,
        custom_parameters: {
          user_id: userId,
          activation_timestamp: new Date().toISOString()
        }
      });
    }
  }, []);

  // 🔄 Отслеживание успешного автоплатежа  
  const trackRecurringPayment = useCallback((data) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'recurring_payment_success', {
        event_category: 'retention',
        event_label: 'auto_renewal',
        value: data.amount,
        currency: 'USD',
        custom_parameters: {
          subscription_id: data.subscriptionId,
          billing_cycle: data.billingCycle,
          payment_attempt: data.attempt || 1
        }
      });
    }
  }, []);

  return {
    trackImageGeneration,
    trackRegistration,
    trackSubscriptionPurchase,
    trackBeginCheckout,
    trackFirstGeneration,
    trackRecurringPayment
  };
};

// 📊 Глобальные утилиты аналитики
export const analytics = {
  // 🎯 Отслеживание просмотров страниц
  trackPageView: (pagePath) => {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-4YRCTLBJ8J', {
        page_path: pagePath
      });
    }
  },

  // 💡 Отслеживание кастомных событий
  trackCustomEvent: (eventName, parameters = {}) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  },

  // 👤 Установка пользовательских параметров
  setUserProperties: (properties) => {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-4YRCTLBJ8J', {
        user_properties: properties
      });
    }
  }
};
