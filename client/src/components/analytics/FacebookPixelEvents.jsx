// Facebook Pixel tracking events for conversions
export const FacebookPixelEvents = {
  // Track user registration
  trackRegistration: (userData = {}) => {
    if (window.fbq) {
      window.fbq("track", "CompleteRegistration", {
        content_name: "User Registration",
        status: "completed",
        ...userData
      });
      console.log("Facebook Pixel: Registration tracked");
    }
  },

  // Track subscription purchase
  trackSubscription: (subscriptionData = {}) => {
    if (window.fbq) {
      window.fbq("track", "Subscribe", {
        content_name: subscriptionData.planName || "Premium Plan",
        value: subscriptionData.value || 9.99,
        currency: subscriptionData.currency || "USD",
        predicted_ltv: subscriptionData.predicted_ltv || 120,
        ...subscriptionData
      });
      console.log("Facebook Pixel: Subscription tracked", subscriptionData);
    }
  },

  // Track cart purchase
  trackPurchase: (purchaseData = {}) => {
    if (window.fbq) {
      window.fbq("track", "Purchase", {
        content_name: purchaseData.productName || "Cart Purchase",
        value: purchaseData.value || 19.99,
        currency: purchaseData.currency || "USD",
        content_ids: purchaseData.content_ids || [],
        content_type: purchaseData.content_type || "product",
        ...purchaseData
      });
      console.log("Facebook Pixel: Purchase tracked", purchaseData);
    }
  },

  // Track initiate checkout
  trackInitiateCheckout: (checkoutData = {}) => {
    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_name: checkoutData.productName || "Cart Checkout",
        value: checkoutData.value || 19.99,
        currency: checkoutData.currency || "USD",
        content_ids: checkoutData.content_ids || [],
        content_type: checkoutData.content_type || "product",
        num_items: checkoutData.num_items || 1,
        ...checkoutData
      });
      console.log("Facebook Pixel: InitiateCheckout tracked", checkoutData);
    }
  },

  // Track add to cart
  trackAddToCart: (productData = {}) => {
    if (window.fbq) {
      window.fbq("track", "AddToCart", {
        content_name: productData.productName || "Product",
        value: productData.value || 9.99,
        currency: productData.currency || "USD",
        content_ids: productData.content_ids || [],
        content_type: productData.content_type || "product",
        ...productData
      });
      console.log("Facebook Pixel: AddToCart tracked", productData);
    }
  },

  // Track custom event
  trackCustom: (eventName, data = {}) => {
    if (window.fbq) {
      window.fbq("trackCustom", eventName, data);
      console.log(`Facebook Pixel: Custom event "${eventName}" tracked`, data);
    }
  }
};

export default FacebookPixelEvents;