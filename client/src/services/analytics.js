/**
 * 🚀 ColibRRRi AI Analytics Service
 * Comprehensive tracking system for AI image generation platform
 */

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.trackingId = 'G-0Z4DR2MN0C';
    this.debugMode = process.env.NODE_ENV === 'development';
    this.init();
  }

  init() {
    if (typeof window !== 'undefined' && window.gtag) {
      this.isInitialized = true;
      if (this.debugMode) {
        console.log('🔥 ColibRRRi Analytics initialized');
      }
    }
  }

  // 📊 CORE TRACKING METHODS
  track(eventName, parameters = {}) {
    if (!this.isInitialized) return;
    
    const enrichedParams = {
      ...parameters,
      timestamp: Date.now(),
      page_location: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      app_version: '1.0.0'
    };

    if (this.debugMode) {
      console.log('📈 Analytics Event:', eventName, enrichedParams);
    }

    window.gtag('event', eventName, enrichedParams);
  }

  // 🎨 AI GENERATION EVENTS
  aiGenerationStarted(data) {
    this.track('ai_generation_started', {
      event_category: 'AI_Generation',
      model_type: data.model || 'unknown',
      style_selected: data.style || 'none',
      prompt_length: data.prompt?.length || 0,
      has_negative_prompt: Boolean(data.negativePrompt),
      aspect_ratio: data.aspectRatio || 'unknown',
      batch_size: data.batchSize || 1,
      user_credits: data.userCredits || 0,
      generation_cost: data.creditCost || 0
    });
  }

  aiGenerationCompleted(data) {
    this.track('ai_generation_completed', {
      event_category: 'AI_Generation',
      model_type: data.model,
      style_selected: data.style,
      generation_time: data.generationTime || 0,
      success: data.success,
      error_type: data.error || null,
      images_generated: data.imagesCount || 0,
      credits_used: data.creditsUsed || 0,
      user_satisfaction: data.rating || null
    });
  }

  aiModelSelected(modelType) {
    this.track('ai_model_selected', {
      event_category: 'User_Interaction',
      model_type: modelType,
      selection_source: 'model_selector'
    });
  }

  aiStyleSelected(style, category) {
    this.track('ai_style_selected', {
      event_category: 'User_Interaction',
      style_name: style,
      style_category: category || 'unknown'
    });
  }

  // 💰 E-COMMERCE EVENTS
  subscriptionViewed(plan) {
    this.track('view_item', {
      event_category: 'E-commerce',
      currency: 'USD',
      value: this.getPlanValue(plan),
      items: [{
        item_id: plan,
        item_name: `${plan} Subscription`,
        item_category: 'subscription',
        price: this.getPlanValue(plan),
        quantity: 1
      }]
    });
  }

  subscriptionPurchased(data) {
    this.track('purchase', {
      event_category: 'E-commerce',
      transaction_id: data.transactionId,
      currency: 'USD',
      value: data.amount,
      payment_method: data.paymentMethod || 'unknown',
      items: [{
        item_id: data.plan,
        item_name: `${data.plan} Subscription`,
        item_category: 'subscription',
        price: data.amount,
        quantity: 1
      }]
    });
  }

  subscriptionCancelled(plan, reason) {
    this.track('subscription_cancelled', {
      event_category: 'E-commerce',
      plan_type: plan,
      cancellation_reason: reason || 'unknown',
      user_tenure_days: this.getUserTenure()
    });
  }

  // 👤 USER ENGAGEMENT EVENTS
  userRegistered(method) {
    this.track('sign_up', {
      event_category: 'User_Lifecycle',
      method: method, // 'google', 'facebook', 'email'
      user_type: 'new'
    });
  }

  userLoggedIn(method) {
    this.track('login', {
      event_category: 'User_Lifecycle',
      method: method
    });
  }

  imageDownloaded(data) {
    this.track('image_downloaded', {
      event_category: 'User_Engagement',
      image_id: data.imageId,
      model_used: data.model,
      style_used: data.style,
      download_format: data.format || 'png',
      file_size: data.fileSize || 0
    });
  }

  imageShared(data) {
    this.track('share', {
      event_category: 'User_Engagement',
      method: data.platform, // 'twitter', 'facebook', 'instagram', 'copy_link'
      content_type: 'ai_generated_image',
      image_id: data.imageId
    });
  }

  imageFavorited(imageId) {
    this.track('image_favorited', {
      event_category: 'User_Engagement',
      image_id: imageId,
      action: 'add_to_favorites'
    });
  }

  // 📱 USER EXPERIENCE EVENTS
  pageViewed(pageName, additionalData = {}) {
    this.track('page_view', {
      event_category: 'Navigation',
      page_name: pageName,
      ...additionalData
    });
  }

  featureUsed(featureName, context = {}) {
    this.track('feature_used', {
      event_category: 'Feature_Usage',
      feature_name: featureName,
      ...context
    });
  }

  errorOccurred(errorType, errorMessage, context = {}) {
    this.track('error_occurred', {
      event_category: 'Error_Tracking',
      error_type: errorType,
      error_message: errorMessage,
      ...context
    });
  }

  performanceMetric(metricName, value, unit = 'ms') {
    this.track('performance_metric', {
      event_category: 'Performance',
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit
    });
  }

  // 🎯 CONVERSION GOALS
  goalCompleted(goalName, value = 0) {
    this.track(goalName, {
      event_category: 'Conversion',
      value: value,
      currency: 'USD'
    });
  }

  // 🎯 GOOGLE ADS CONVERSIONS
  trackGoogleAdsConversion(conversionId, conversionLabel, value = null, currency = 'USD', transactionId = null) {
    if (!this.isInitialized) return;
    
    const conversionData = {
      'send_to': `${conversionId}/${conversionLabel}`
    };
    
    if (value) {
      conversionData.value = value;
      conversionData.currency = currency;
    }
    
    if (transactionId) {
      conversionData.transaction_id = transactionId;
    }
    
    window.gtag('event', 'conversion', conversionData);
    
    if (this.debugMode) {
      console.log('🎯 Google Ads conversion tracked:', {
        conversionId,
        conversionLabel,
        value,
        currency,
        transactionId
      });
    }
  }

  // 💰 SUBSCRIPTION PURCHASE CONVERSION (GA4 + Google Ads)
  trackSubscriptionPurchase(subscriptionPrice, transactionId, plan = 'unknown') {
    // GA4 Enhanced E-commerce
    this.subscriptionPurchased({
      plan: plan,
      amount: subscriptionPrice,
      paymentMethod: 'wayforpay',
      transactionId: transactionId
    });
    
    // Google Ads Conversion (заменить на реальные ID после настройки)
    // this.trackGoogleAdsConversion('AW-XXXXXXXXX', 'SUBSCRIPTION_CONVERSION_LABEL', subscriptionPrice, 'USD', transactionId);
    
    if (this.debugMode) {
      console.log('💰 Subscription purchase tracked:', { subscriptionPrice, transactionId, plan });
    }
  }

  // 📝 USER SIGNUP CONVERSION (GA4 + Google Ads)
  trackUserSignUp(method = 'email') {
    // GA4
    this.userRegistered(method);
    
    // Google Ads Conversion (заменить на реальные ID после настройки)
    // this.trackGoogleAdsConversion('AW-XXXXXXXXX', 'SIGNUP_CONVERSION_LABEL');
    
    if (this.debugMode) {
      console.log('📝 User signup tracked:', { method });
    }
  }

  // 🎨 AI GENERATION COMPLETED CONVERSION (GA4 + Google Ads)
  trackAIGenerationCompleted(data) {
    // GA4
    this.aiGenerationCompleted(data);
    
    // Google Ads Conversion (заменить на реальные ID после настройки)
    // this.trackGoogleAdsConversion('AW-XXXXXXXXX', 'AI_GENERATION_CONVERSION_LABEL');
    
    if (this.debugMode) {
      console.log('🎨 AI generation completed tracked:', data);
    }
  }

  // 📊 CUSTOM DIMENSIONS
  setUserProperties(properties) {
    if (!this.isInitialized) return;
    
    window.gtag('config', this.trackingId, {
      user_properties: properties
    });
  }

  // 🛠️ UTILITY METHODS
  getPlanValue(plan) {
    const planPrices = {
      'free': 0,
      'basic': 9.99,
      'pro': 19.99,
      'premium': 39.99
    };
    return planPrices[plan] || 0;
  }

  getUserTenure() {
    const userCreatedAt = localStorage.getItem('user_created_at');
    if (!userCreatedAt) return 0;
    
    const now = new Date();
    const created = new Date(userCreatedAt);
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  // 🎨 AI-SPECIFIC TRACKING
  promptAnalytics(prompt, metadata = {}) {
    const promptAnalysis = {
      length: prompt.length,
      word_count: prompt.split(' ').length,
      has_colors: /\b(red|blue|green|yellow|purple|orange|pink|black|white|gray|brown)\b/i.test(prompt),
      has_emotions: /\b(happy|sad|angry|excited|calm|dramatic|peaceful|energetic)\b/i.test(prompt),
      has_art_style: /\b(realistic|cartoon|anime|painting|sketch|digital|oil|watercolor)\b/i.test(prompt),
      complexity_score: this.calculatePromptComplexity(prompt)
    };

    this.track('prompt_analyzed', {
      event_category: 'AI_Analysis',
      ...promptAnalysis,
      ...metadata
    });
  }

  calculatePromptComplexity(prompt) {
    let score = 0;
    score += prompt.length * 0.1;
    score += (prompt.match(/,/g) || []).length * 2;
    score += (prompt.match(/\b(detailed|intricate|complex|elaborate)\b/gi) || []).length * 5;
    return Math.min(100, Math.round(score));
  }

  // 🔄 SESSION TRACKING
  sessionStart() {
    this.track('session_start', {
      event_category: 'Session',
      session_id: this.generateSessionId()
    });
  }

  sessionEnd(duration) {
    this.track('session_end', {
      event_category: 'Session',
      session_duration: duration
    });
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 🚀 Export singleton instance
const analytics = new AnalyticsService();
export default analytics;

// 📝 Usage Examples:
/*
// AI Generation
analytics.aiGenerationStarted({
  model: 'flux-pro',
  style: 'anime',
  prompt: 'beautiful anime girl',
  userCredits: 100,
  creditCost: 10
});

// E-commerce with Google Ads Conversion
analytics.trackSubscriptionPurchase(19.99, 'wp_12345', 'pro');

// User Registration with Google Ads Conversion
analytics.trackUserSignUp('google');

// AI Generation with Google Ads Conversion
analytics.trackAIGenerationCompleted({
  model: 'flux-pro',
  style: 'anime',
  generationTime: 15000,
  success: true,
  imagesCount: 1,
  creditsUsed: 10
});

// Direct Google Ads Conversion
analytics.trackGoogleAdsConversion('AW-XXXXXXXXX', 'CONVERSION_LABEL', 29.99, 'USD', 'txn_123');
*/