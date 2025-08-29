import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import WayForPayRecurringService from '../services/wayforpayRecurringService.js';

const prisma = new PrismaClient();
const recurringService = new WayForPayRecurringService();

// Get credentials from environment
const MERCHANT_LOGIN = process.env.WAYFORPAY_MERCHANT_LOGIN;
const MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET;
const MERCHANT_PASSWORD = process.env.WAYFORPAY_MERCHANT_PASSWORD;

// Plan configurations with language-specific pricing and URLs
const getPlanConfig = (language = 'en') => {
  if (language === 'uk' || language === 'ua') {
    // Ukrainian pricing (₴ - hryvnia)
    return {
      BASIC: {
        amount: 1,
        currency: 'UAH',
        credits: 800,
        name: 'Базовий план',
        buttonUrl: process.env.WAYFORPAY_BASIC_BUTTON_URL_UK
      },
      PRO: {
        amount: 1200,
        currency: 'UAH', 
        credits: 3000,
        name: 'ПРО план',
        buttonUrl: process.env.WAYFORPAY_PRO_BUTTON_URL_UK
      },
      ENTERPRISE: {
        amount: 4000,
        currency: 'UAH',
        credits: 15000,
        name: 'Максимальний план',
        buttonUrl: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL_UK
      }
    };
  } else {
    // English pricing (UAH for testing)  
    return {
      BASIC: {
        amount: 1,
        currency: 'UAH', // WayForPay works in UAH
        credits: 800,
        name: 'Basic Plan',
        buttonUrl: process.env.WAYFORPAY_BASIC_BUTTON_URL
      },
      PRO: {
        amount: 1200,
        currency: 'UAH',
        credits: 3000,
        name: 'Pro Plan',
        buttonUrl: process.env.WAYFORPAY_PRO_BUTTON_URL
      },
      ENTERPRISE: {
        amount: 4000,
        currency: 'UAH',
        credits: 15000,
        name: 'Maximum Plan',
        buttonUrl: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL
      }
    };
  }
};

/**
 * Generate signature for WayForPay callback verification
 */
const generateCallbackSignature = (data) => {
  // WayForPay callback signature format: merchantAccount, orderReference, amount, currency, authCode, cardPan, transactionStatus, reasonCode
  const signString = [
    MERCHANT_LOGIN, // merchantAccount
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode || '',
    data.cardPan || '',
    data.transactionStatus,
    data.reasonCode
  ].join(';');
  
  console.log('🔐 Generating callback signature with fields:', {
    merchantAccount: MERCHANT_LOGIN,
    orderReference: data.orderReference,
    amount: data.amount,
    currency: data.currency,
    authCode: data.authCode || '',
    cardPan: data.cardPan || '',
    transactionStatus: data.transactionStatus,
    reasonCode: data.reasonCode,
    signString
  });
  
  return crypto.createHmac('md5', MERCHANT_SECRET)
    .update(signString)
    .digest('hex');
};

/**
 * Generate signature for WayForPay request
 */
const generateSignature = (data) => {
  const signString = [
    MERCHANT_LOGIN,
    data.orderReference,
    data.amount,
    data.currency,
    data.productName,
    data.productCount,
    data.productPrice
  ].join(';');
  
  return crypto.createHmac('md5', MERCHANT_SECRET)
    .update(signString)
    .digest('hex');
};

/**
 * Generate signature for WayForPay REMOVE request
 */
const generateRemoveSignature = (orderReference) => {
  // For REMOVE request: requestType, merchantAccount, merchantPassword, orderReference
  const signString = [
    'REMOVE',
    MERCHANT_LOGIN,
    MERCHANT_PASSWORD,
    orderReference
  ].join(';');
  
  console.log('🔐 Generating REMOVE signature with fields:', {
    requestType: 'REMOVE',
    merchantAccount: MERCHANT_LOGIN,
    merchantPassword: '[MASKED]',
    orderReference,
    signString: signString.replace(MERCHANT_PASSWORD, '[MASKED]')
  });
  
  return crypto.createHmac('md5', MERCHANT_SECRET)
    .update(signString)
    .digest('hex');
};

/**
 * Initialize payment for subscription
 */
export const initializePayment = async (req, res) => {
  try {
    const { planId, language } = req.body;
    const userId = req.user.id;
    
    // Get language-specific plan configuration
    const PLAN_CONFIG = getPlanConfig(language);
    
    // Validate plan
    if (!PLAN_CONFIG[planId]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan selected' 
      });
    }
    
    const plan = PLAN_CONFIG[planId];
    const orderReference = `ORDER_${userId}_${Date.now()}`;
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: plan.amount,
        currency: 'UAH',
        status: 'PENDING',
        description: plan.name
      }
    });
    
    // Get language from request (default to 'en')
    const lang = req.body.language || 'en';
    
    // Generate payment data
    const paymentData = {
      merchantAccount: MERCHANT_LOGIN,
      orderReference,
      orderDate: Math.floor(Date.now() / 1000),
      amount: plan.amount,
      currency: 'UAH',
      productName: [plan.name],
      productCount: [1],
      productPrice: [plan.amount],
      clientFirstName: req.user.fullName?.split(' ')[0] || 'User',
      clientLastName: req.user.fullName?.split(' ')[1] || '',
      clientEmail: req.user.email,
      language: 'UA',
      returnUrl: `${process.env.BASE_URL}/api/payments/wayforpay/success`,
      serviceUrl: `${process.env.BASE_URL}/api/payments/wayforpay/callback`
    };
    
    // Generate signature
    paymentData.merchantSignature = generateSignature(paymentData);
    
    res.json({
      success: true,
      paymentData,
      buttonUrl: plan.buttonUrl
    });
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize payment' 
    });
  }
};

/**
 * Handle WayForPay callback
 */
export const handleCallback = async (req, res) => {
  try {
    console.log('=== WayForPay Callback Received ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // WayForPay sends data in a strange format - extract the JSON string from the key
    let callbackData;
    
    // Check if data comes as JSON string in the key (common WayForPay format)
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length >= 1 && bodyKeys[0].startsWith('{')) {
      try {
        // Get the JSON string key (first key that starts with '{')
        const jsonKey = bodyKeys.find(key => key.startsWith('{'));
        
        // Handle truncated JSON by trying to repair it
        let jsonString = jsonKey;
        
        // If the JSON is truncated (doesn't end with '}'), try to find complete fields
        if (!jsonString.endsWith('}')) {
          // Find the last complete field before truncation
          const lastCompleteField = jsonString.lastIndexOf('","');
          if (lastCompleteField > 0) {
            // Add closing quote and brace to make valid JSON
            jsonString = jsonString.substring(0, lastCompleteField + 1) + '}';
          } else {
            // Try to find the last field with a value
            const lastFieldMatch = jsonString.match(/,"([^"]+)":([^,}]+)$/);
            if (lastFieldMatch) {
              jsonString = jsonString + '}';
            } else {
              // As last resort, try to close at the last quote
              const lastQuote = jsonString.lastIndexOf('"');
              if (lastQuote > 0) {
                jsonString = jsonString.substring(0, lastQuote + 1) + '}';
              }
            }
          }
        }
        
        console.log('🔧 Attempting to parse JSON:', jsonString.substring(0, 200) + '...');
        callbackData = JSON.parse(jsonString);
        console.log('✅ Successfully parsed callback data from JSON key');
      } catch (parseError) {
        console.log('❌ Failed to parse JSON from key:', parseError.message);
        console.log('❌ Using req.body directly (this will likely fail field extraction)');
        callbackData = req.body;
      }
    } else {
      console.log('📝 Using req.body directly (standard format)');
      callbackData = req.body;
    }
    
    console.log('Processed callback data:', JSON.stringify(callbackData, null, 2));
    console.log('📋 Available fields in callbackData:', Object.keys(callbackData));
    console.log('📋 Field values preview:', {
      merchantAccount: callbackData.merchantAccount,
      orderReference: callbackData.orderReference,
      merchantSignature: callbackData.merchantSignature,
      amount: callbackData.amount,
      currency: callbackData.currency,
      authCode: callbackData.authCode,
      transactionStatus: callbackData.transactionStatus,
      reasonCode: callbackData.reasonCode
    });
    
    const {
      orderReference,
      status,
      time,
      merchantSignature: signature,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      reason,
      authCode,
      cardPan,
      email: clientEmail,
      clientFirstName,
      clientLastName,
      recToken // Recurring payment token from WayForPay
    } = callbackData;
    
    console.log('🔍 Extracted field values:', {
      orderReference,
      status, 
      time,
      signature,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      reason,
      authCode,
      cardPan,
      clientEmail,
      clientFirstName,
      clientLastName,
      recToken: recToken || 'NOT PROVIDED'
    });
    
    if (recToken) {
      console.log('🎫 RECURRING TOKEN RECEIVED:', recToken);
    } else {
      console.log('⚠️ NO RECURRING TOKEN IN CALLBACK');
    }
    
    // Verify signature for callback
    const expectedSignature = generateCallbackSignature({
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode
    });
    
    console.log('Signature verification:', {
      received: signature,
      expected: expectedSignature,
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode,
      match: signature === expectedSignature
    });
    
    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature in callback');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    console.log('✅ Signature verified successfully');
    
    // Enhanced user identification with PaymentIntent tracking
    let user;
    let paymentIntent = null;

    // First priority: Try to find payment intent by trackingId
    const trackingId = req.query.trackingId || callbackData.trackingId;
    
    if (trackingId) {
      console.log('🔍 Looking for payment intent with trackingId:', trackingId);
      try {
        paymentIntent = await prisma.paymentIntent.findUnique({
          where: { trackingId },
          include: { user: true }
        });
        
        if (paymentIntent) {
          user = paymentIntent.user;
          console.log('✅ Found payment intent for user:', user.id, 'plan:', paymentIntent.planId);
          
          // Update payment intent with WayForPay data
          await prisma.paymentIntent.update({
            where: { trackingId },
            data: {
              status: transactionStatus === 'Approved' ? 'COMPLETED' : 'FAILED',
              wayforpayData: callbackData,
              updatedAt: new Date()
            }
          });
        } else {
          console.log('⚠️ PaymentIntent not found for trackingId:', trackingId);
        }
      } catch (error) {
        console.error('❌ Error looking up PaymentIntent:', error);
      }
    }

    // Fallback to legacy methods if no payment intent found
    if (!user) {
      console.log('🔄 PaymentIntent not found, trying legacy identification methods...');
      let extractedUserId = null;
      
      // Check if orderReference contains userId (format: ORDER_userId_timestamp or WFP-BTN-...)
      if (orderReference && orderReference.startsWith('ORDER_')) {
        const parts = orderReference.split('_');
        if (parts.length >= 3) {
          extractedUserId = parts[1];
          console.log('📌 Extracted userId from orderReference:', extractedUserId);
        }
      }
      
      // Try to find user by extracted userId first
      if (extractedUserId) {
        try {
          user = await prisma.user.findUnique({
            where: { id: extractedUserId }
          });
          if (user) {
            console.log('✅ Found user by extracted userId:', user.id, user.email);
          }
        } catch (error) {
          console.log('⚠️ Could not find user by extracted userId:', error.message);
        }
      }
      
      // If no user found by userId, try by email (for backward compatibility with button URLs)
      if (!user) {
        const userEmail = clientEmail || req.body.clientEmail;
        console.log('🔍 Looking for user by email:', userEmail);
        
        // IMPORTANT: Check if email exists before querying Prisma
        if (userEmail && userEmail.trim()) {
          user = await prisma.user.findUnique({
            where: { email: userEmail }
          });
          
          if (!user) {
            // Create user if doesn't exist (for guest checkouts)
            user = await prisma.user.create({
              data: {
                email: userEmail,
                username: userEmail.split('@')[0] + '_' + Date.now(),
                fullName: `${clientFirstName || ''} ${clientLastName || ''}`.trim() || 'WayForPay User',
                emailVerified: true,
                totalCredits: 100
              }
            });
            console.log('✅ Created new user:', user.id, userEmail);
          } else {
            console.log('✅ Found existing user by email:', user.id, userEmail);
          }
        } else {
          console.log('⚠️ No email provided in callback data, cannot find or create user');
          throw new Error('Cannot process payment: No email provided in callback data');
        }
      }
    
    // Check if this orderReference has already been processed to prevent duplicates
    console.log('🔍 Checking for duplicate orderReference:', orderReference);
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        wayforpayOrderReference: orderReference,
        status: 'COMPLETED'
      }
    });
    
    if (existingPayment) {
      console.log('⚠️  DUPLICATE DETECTED! OrderReference already processed:', orderReference);
      console.log('   Existing payment ID:', existingPayment.id);
      console.log('   Existing payment date:', existingPayment.createdAt);
      
      // Send success response to WayForPay to acknowledge receipt
      const responseData = {
        orderReference,
        status: 'accept',
        time: Math.floor(Date.now() / 1000)
      };
      
      console.log('📤 Sending acknowledge response for duplicate:', responseData);
      return res.json(responseData);
    }
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        currency,
        status: transactionStatus === 'Approved' ? 'COMPLETED' : 'FAILED',
        description: `WayForPay payment - ${orderReference}`,
        wayforpayOrderReference: orderReference
      }
    });
    
    console.log('✅ Payment record created:', payment.id);
    
    // Process successful payment
    if (transactionStatus === 'Approved') {
      // Determine plan type and credits based on amount
      const planType = amount == 400 ? 'BASIC' : 
                      amount == 1200 ? 'PRO' : 
                      amount == 4000 ? 'ENTERPRISE' : 'BASIC';
      
      // Get credits from default config (same for all languages)
      const defaultConfig = getPlanConfig('en');
      const credits = defaultConfig[planType].credits;
      
      console.log(`💰 Processing payment: ${planType} plan, ${credits} credits`);
      
      // Calculate next payment date (30 days from now)
      const nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Log recurring payment setup
      console.log('📊 Setting up subscription with recurring support:', {
        userId: user.id,
        plan: planType,
        isRecurring: !!recToken,
        hasToken: !!recToken,
        tokenLength: recToken ? recToken.length : 0,
        nextPaymentDate: recToken ? nextPaymentDate : null
      });
      
      // Update user subscription - temporarily disable recurring fields until migration is applied
      const subscriptionData = {
        plan: planType,
        status: 'ACTIVE',
        currentPeriodEnd: nextPaymentDate,
        wayforpayOrderReference: orderReference
      };
      
      // Only add recurring fields if they exist in database (check for production)
      try {
        // Try with recurring fields first
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            ...subscriptionData,
            // Recurring payment fields
            isRecurring: !!recToken,
            recurringToken: recToken || null,
            recurringMode: 'MONTHLY',
            nextPaymentDate: recToken ? nextPaymentDate : null,
            lastPaymentDate: new Date(),
            failedPaymentAttempts: 0
          },
          create: {
            userId: user.id,
            ...subscriptionData,
            // Recurring payment fields
            isRecurring: !!recToken,
            recurringToken: recToken || null,
            recurringMode: 'MONTHLY',
            nextPaymentDate: recToken ? nextPaymentDate : null,
            lastPaymentDate: new Date(),
            failedPaymentAttempts: 0
          }
        });
        console.log('✅ Subscription updated with recurring support');
      } catch (error) {
        // If recurring fields don't exist, update without them
        if (error.message?.includes('does not exist')) {
          console.log('⚠️ Recurring fields not available, updating without them');
          await prisma.subscription.upsert({
            where: { userId: user.id },
            update: subscriptionData,
            create: {
              userId: user.id,
              ...subscriptionData
            }
          });
          console.log('✅ Subscription updated without recurring fields');
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
      
      console.log('✅ Subscription updated');
      
      // Add credits to user
      await prisma.credit.create({
        data: {
          userId: user.id,
          amount: credits,
          type: 'PURCHASE',
          description: `WayForPay ${planType} plan purchase - ${orderReference}`
        }
      });
      
      console.log('✅ Credit record created');
      
      // Update user total credits
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalCredits: {
            increment: credits
          },
          lastCreditUpdate: new Date()
        }
      });
      
      console.log(`🎉 Successfully added ${credits} credits to user ${user.email}`);
      console.log('=== Payment Processing Complete ===');
    }
    
    // Send response to WayForPay
    const responseData = {
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000)
    };
    
    // Generate response signature
    const responseSignature = crypto.createHmac('md5', MERCHANT_SECRET)
      .update([MERCHANT_LOGIN, responseData.orderReference, responseData.status].join(';'))
      .digest('hex');
    
    responseData.signature = responseSignature;
    
    console.log('📤 Sending callback response:', responseData);
    res.json(responseData);
  } 
  } catch (error) {
    console.error('❌ Callback processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Callback processing failed' 
    });
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const payment = await prisma.payment.findFirst({
      where: { 
        description: { contains: orderId }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            totalCredits: true,
            subscription: true
          }
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    res.json({
      success: true,
      payment
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check payment status' 
    });
  }
};

/**
 * Initialize one-time payment for cart items (no recurring)
 */
export const initializeCartPayment = async (req, res) => {
  try {
    const { items, total, currency = 'USD' } = req.body;
    
    // Validate cart data
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart is empty or invalid' 
      });
    }
    
    if (!total || total <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid total amount' 
      });
    }
    
    // Generate unique order reference
    const orderReference = `CART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🛒 Initializing cart payment:', {
      orderReference,
      items: items.length,
      total,
      currency
    });
    
    // Prepare product arrays for WayForPay
    const productNames = items.map(item => item.name);
    const productPrices = items.map(item => item.price);
    const productCounts = items.map(item => item.quantity);
    
    // Generate payment data for WayForPay (one-time payment, no recurring)
    const paymentData = {
      merchantAccount: MERCHANT_LOGIN,
      merchantDomainName: 'vheer.com', // Use .com domain to suggest international
      orderReference,
      orderDate: Math.floor(Date.now() / 1000),
      amount: total,
      currency: currency,
      productName: productNames,
      productCount: productCounts,
      productPrice: productPrices,
      // One-time payment settings (no recurring)
      merchantTransactionType: 'SALE', // Direct sale, not AUTH
      language: 'UA', // Changed to Ukrainian for UAH currency
      returnUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/wayforpay/success`,
      serviceUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/wayforpay/cart-callback`,
      
      // Pre-fill fields if user is authenticated, otherwise leave empty
      clientFirstName: req.user?.fullName?.split(' ')[0] || '',
      clientLastName: req.user?.fullName?.split(' ')[1] || '',
      clientEmail: req.user?.email || '',
      clientPhone: req.user?.phone || '',
      clientAddress: req.user?.address || '',
      clientCity: req.user?.city || '',
      clientCountry: req.user?.country || 'United States', // Use user's country or default to US
      
      // Pre-fill delivery fields with client info if available
      deliveryFirstName: req.user?.fullName?.split(' ')[0] || '',
      deliveryLastName: req.user?.fullName?.split(' ')[1] || '',
      deliveryPhone: req.user?.phone || '',
      deliveryAddress: req.user?.address || '',
      deliveryCountry: req.user?.country || 'United States',
      
      // Enable delivery options block on payment page (address delivery only)  
      deliveryList: 'other',
      
      // Try to force international settings
      defaultPaymentSystem: 'card'
    };
    
    // Generate signature for one-time payment
    const signString = [
      MERCHANT_LOGIN,
      paymentData.merchantDomainName,
      paymentData.orderReference,
      paymentData.orderDate,
      paymentData.amount,
      paymentData.currency,
      ...productNames,
      ...productCounts,
      ...productPrices
    ].join(';');
    
    paymentData.merchantSignature = crypto.createHmac('md5', MERCHANT_SECRET)
      .update(signString)
      .digest('hex');
    
    console.log('✅ Cart payment data generated:', {
      orderReference: paymentData.orderReference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      products: productNames.length,
      signature: paymentData.merchantSignature
    });
    
    // Handle user for payment - use real user data if available
    let userId = req.user?.id;
    let userEmail = req.user?.email;
    let userName = req.user?.fullName || req.user?.username;
    
    if (!userId) {
      // For guest checkout, we'll update with real data from WayForPay callback
      const guestUser = await prisma.user.create({
        data: {
          email: `${orderReference}@order.com`, // Temporary, will be updated from callback
          username: `guest_${Date.now()}`,
          fullName: 'Pending Customer Info', // Will be updated from WayForPay
          emailVerified: false,
          totalCredits: 0
        }
      });
      userId = guestUser.id;
      userEmail = guestUser.email;
      userName = guestUser.fullName;
      console.log('👤 Created temporary guest user for payment:', userId);
    }
    
    // Store cart order in database
    const payment = await prisma.payment.create({
      data: {
        userId: userId, // Now always has a valid userId
        amount: total,
        currency: currency,
        status: 'PENDING',
        description: `Cart payment - ${productNames.join(', ')}`,
        wayforpayOrderReference: orderReference
      }
    });
    
    // Store cart items and metadata separately in memory for callback use
    const paymentMetadata = {
      cartItems: items.map(item => ({
        ...item,
        // Ensure all item properties are preserved
        frameColor: item.frameColor || item.frameColorName,
        size: item.size || item.sizeName,
        originalData: item // Keep full original data as backup
      })),
      userEmail: userEmail,
      userName: userName,
      isGuest: !req.user?.id
    };
    
    // Store in a temporary cache (you could use Redis or in-memory Map)
    // For now, we'll store it in the payment description as JSON
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        description: JSON.stringify({
          text: `Cart payment - ${productNames.join(', ')}`,
          metadata: paymentMetadata
        })
      }
    });
    
    console.log('📝 Payment record created:', payment.id);
    
    console.log('📤 Sending response to frontend:', {
      success: true,
      orderReference,
      paymentId: payment.id,
      paymentDataFields: Object.keys(paymentData),
      additionalFieldsIncluded: [
        'clientFirstName', 'clientLastName', 'clientEmail', 'clientPhone',
        'clientAddress', 'clientCity', 'deliveryFirstName', 'deliveryLastName',
        'deliveryPhone', 'deliveryAddress'
      ]
    });
    
    res.json({
      success: true,
      paymentData,
      orderReference,
      paymentId: payment.id
    });
    
  } catch (error) {
    console.error('❌ Cart payment initialization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize cart payment' 
    });
  }
};

/**
 * Handle WayForPay callback for cart payments (one-time)
 */
export const handleCartCallback = async (req, res) => {
  try {
    console.log('=== WayForPay Cart Callback Received ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Parse callback data (same logic as subscription callback)
    let callbackData;
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length >= 1 && bodyKeys[0].startsWith('{')) {
      try {
        const jsonKey = bodyKeys.find(key => key.startsWith('{'));
        let jsonString = jsonKey;
        
        if (!jsonString.endsWith('}')) {
          const lastCompleteField = jsonString.lastIndexOf('","');
          if (lastCompleteField > 0) {
            jsonString = jsonString.substring(0, lastCompleteField + 1) + '}';
          }
        }
        
        callbackData = JSON.parse(jsonString);
        console.log('✅ Successfully parsed cart callback data from JSON key');
      } catch (parseError) {
        console.log('❌ Failed to parse JSON from key:', parseError.message);
        callbackData = req.body;
      }
    } else {
      callbackData = req.body;
    }
    
    const {
      orderReference,
      merchantSignature: signature,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      authCode,
      cardPan,
      // WayForPay sends these fields in different formats
      clientName, // Single field with full name (e.g., "John Doe" or "NoCLIENT NAME")
      email, // Direct email field
      phone, // Direct phone field
      // Additional fields that might be filled on payment page
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientCity,
      clientCountry,
      deliveryFirstName,
      deliveryLastName,
      deliveryPhone,
      deliveryAddress,
      deliveryCity,
      deliveryCountry,
      deliveryPostalCode,
      // Product information
      productName,
      productCount,
      productPrice
    } = callbackData;
    
    console.log('🔍 Cart callback data:', {
      orderReference,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      signature,
      clientName,
      email,
      phone,
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      // Log all address fields
      clientAddress,
      clientCity,
      clientCountry,
      deliveryAddress,
      deliveryCity,
      deliveryCountry,
      deliveryPostalCode
    });
    
    // Parse client name if provided as single field
    let parsedFirstName = clientFirstName;
    let parsedLastName = clientLastName;
    let parsedEmail = clientEmail || email; // Use direct email field if clientEmail not provided
    let parsedPhone = clientPhone || phone; // Use direct phone field if clientPhone not provided
    
    // Handle clientName field (single string with full name)
    if (clientName && clientName !== 'NoCLIENT NAME' && !clientFirstName) {
      const nameParts = clientName.trim().split(' ');
      parsedFirstName = nameParts[0] || '';
      parsedLastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Log additional user-filled fields if present
    const additionalFields = {
      clientFirstName: parsedFirstName,
      clientLastName: parsedLastName,
      clientEmail: parsedEmail,
      clientPhone: parsedPhone,
      clientName, // Log original clientName field
      email, // Log direct email field
      phone, // Log direct phone field
      clientAddress,
      clientCity,
      clientCountry,
      deliveryFirstName,
      deliveryLastName,
      deliveryPhone,
      deliveryAddress
    };
    
    const filledFields = Object.entries(additionalFields)
      .filter(([key, value]) => value && (typeof value === 'string' ? value.trim() : value))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    if (Object.keys(filledFields).length > 0) {
      console.log('👤 Additional fields filled by user:', filledFields);
    }
    
    // Log all available callback data to debug missing fields
    console.log('🔍 All callback data fields:', Object.keys(callbackData));
    console.log('🔍 Full callback data:', JSON.stringify(callbackData, null, 2));
    
    // Verify signature
    const expectedSignature = generateCallbackSignature({
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode
    });
    
    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature in cart callback');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    console.log('✅ Cart callback signature verified');
    
    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { 
        wayforpayOrderReference: orderReference
      }
    });
    
    // Parse metadata from description if stored as JSON
    let paymentMetadata = null;
    if (payment && payment.description) {
      try {
        const parsed = JSON.parse(payment.description);
        if (parsed.metadata) {
          paymentMetadata = parsed.metadata;
        }
      } catch (e) {
        // Description is not JSON, ignore
      }
    }
    
    if (!payment) {
      console.error('❌ Payment record not found for orderReference:', orderReference);
      return res.status(404).json({ 
        success: false, 
        message: 'Payment record not found' 
      });
    }
    
    // Check for duplicate processing
    if (payment.status === 'COMPLETED') {
      console.log('⚠️ Cart payment already processed:', orderReference);
      
      const responseData = {
        orderReference,
        status: 'accept',
        time: Math.floor(Date.now() / 1000)
      };
      
      return res.json(responseData);
    }
    
    // Update payment status and add customer info to description
    let descriptionAddition = '';
    if (Object.keys(filledFields).length > 0) {
      const customerInfo = [];
      if (clientFirstName || clientLastName) {
        customerInfo.push(`Customer: ${clientFirstName || ''} ${clientLastName || ''}`.trim());
      }
      if (clientEmail) customerInfo.push(`Email: ${clientEmail}`);
      if (clientPhone) customerInfo.push(`Phone: ${clientPhone}`);
      if (clientAddress || clientCity || clientCountry) {
        const addressParts = [clientAddress, clientCity, clientCountry].filter(part => part && part.trim());
        if (addressParts.length > 0) {
          customerInfo.push(`Address: ${addressParts.join(', ')}`);
        }
      }
      if (deliveryAddress) customerInfo.push(`Delivery: ${deliveryAddress}`);
      
      if (customerInfo.length > 0) {
        descriptionAddition = ` | ${customerInfo.join(' | ')}`;
      }
    }
    
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: transactionStatus === 'Approved' ? 'COMPLETED' : 'FAILED',
        description: payment.description + descriptionAddition
      }
    });
    
    console.log('✅ Cart payment record updated:', updatedPayment.id);
    
    if (transactionStatus === 'Approved') {
      console.log('🎉 Cart payment successful!');
      console.log('💰 Amount:', amount, currency);
      console.log('🛒 Order:', orderReference);
      
      // Create order record with full customer and product details
      try {
        // Build cart items array - use saved cart items from metadata
        let items = [];
        
        // Use saved cart items from payment metadata
        if (paymentMetadata && paymentMetadata.cartItems && Array.isArray(paymentMetadata.cartItems)) {
          items = paymentMetadata.cartItems.map(item => {
            // Restore original item structure
            const originalItem = item.originalData || item;
            return {
              name: originalItem.name || `Frame Poster - ${originalItem.frameColor} - ${originalItem.size}`,
              quantity: originalItem.quantity || 1,
              price: originalItem.price || 0,
              frameColor: originalItem.frameColor || originalItem.frameColorName,
              size: originalItem.size || originalItem.sizeName,
              image: originalItem.imageUrl || originalItem.image || originalItem.design, // Include image URL
              imageUrl: originalItem.imageUrl || originalItem.image || originalItem.design, // Duplicate for compatibility
              ...originalItem // Include all other properties
            };
          });
          console.log('✅ Using detailed cart items from payment metadata:', items);
        } 
        // Fallback to WayForPay product data if no saved items
        else if (productName && productCount && productPrice) {
          const names = Array.isArray(productName) ? productName : [productName];
          const counts = Array.isArray(productCount) ? productCount : [productCount];
          const prices = Array.isArray(productPrice) ? productPrice : [productPrice];
          
          for (let i = 0; i < names.length; i++) {
            // Try to parse frame details from product name
            const nameMatch = names[i].match(/Frame Poster - ([^-]+) - (.+)/);
            items.push({
              name: names[i],
              quantity: parseInt(counts[i]) || 1,
              price: parseFloat(prices[i]) || 0,
              frameColor: nameMatch ? nameMatch[1].trim() : 'Unknown',
              size: nameMatch ? nameMatch[2].trim() : 'Unknown',
              image: null, // No image data in fallback
              imageUrl: null // No image data in fallback
            });
          }
          console.log('⚠️ Using WayForPay product data as fallback:', items);
        } else {
          console.log('❌ No cart items found in payment record or WayForPay data');
        }
        
        // Update guest user with real customer data if available
        if (paymentMetadata && paymentMetadata.isGuest && parsedEmail) {
          try {
            const fullName = parsedFirstName || parsedLastName 
              ? `${parsedFirstName || ''} ${parsedLastName || ''}`.trim() 
              : (clientName && clientName !== 'NoCLIENT NAME' ? clientName : 'Customer');
            
            await prisma.user.update({
              where: { id: payment.userId },
              data: {
                email: parsedEmail,
                fullName: fullName,
                username: parsedEmail.split('@')[0] + '_' + Date.now()
              }
            });
            console.log('✅ Updated guest user with real customer info:', { email: parsedEmail, fullName });
          } catch (updateError) {
            console.log('⚠️ Could not update guest user:', updateError.message);
          }
        }

        // Create the cart order in the database with complete data
        const cartOrder = await prisma.cartOrder.create({
          data: {
            userId: payment.userId,
            orderReference,
            
            // Payment information
            amount: parseFloat(amount),
            currency: currency || 'UAH',
            paymentStatus: 'PAID',
            transactionStatus,
            reasonCode: String(reasonCode || ''), // Convert to string
            authCode,
            cardPan,
            
            // Customer information - use parsed data from WayForPay or payment metadata
            customerFirstName: parsedFirstName || paymentMetadata?.userName?.split(' ')[0] || '',
            customerLastName: parsedLastName || paymentMetadata?.userName?.split(' ')[1] || '',
            customerEmail: parsedEmail || paymentMetadata?.userEmail || `${orderReference}@order.com`,
            customerPhone: parsedPhone || '',
            customerAddress: clientAddress || '',
            customerCity: clientCity || '',
            customerCountry: clientCountry || '',
            
            // Shipping address
            shippingFirstName: deliveryFirstName || parsedFirstName || paymentMetadata?.userName?.split(' ')[0] || '',
            shippingLastName: deliveryLastName || parsedLastName || paymentMetadata?.userName?.split(' ')[1] || '',
            shippingAddress: deliveryAddress || clientAddress || '',
            shippingCity: deliveryCity || clientCity || '',
            shippingCountry: deliveryCountry || clientCountry || '',
            shippingPostalCode: deliveryPostalCode || '',
            shippingPhone: deliveryPhone || clientPhone || '',
            
            // Order items with full details
            items: items,
            
            // Order status
            orderStatus: 'PROCESSING',
            
            // Timestamps
            paidAt: new Date()
          }
        });
        
        console.log('✅ Cart order created:', cartOrder.id);
        
        // Помечаем корзину как оплаченную
        try {
          // Получаем sessionId из localStorage или генерируем
          const sessionId = callbackData.sessionId || `session_${orderReference}`;
          
          const cartSession = await prisma.cartSession.findFirst({
            where: {
              OR: [
                { sessionId },
                { userId: payment.userId },
                { 
                  AND: [
                    { totalAmount: parseFloat(amount) },
                    { isAbandoned: false }, // Use existing field instead of status
                    { 
                      updatedAt: {
                        gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // За последние 2 часа
                      }
                    }
                  ]
                }
              ]
            },
            orderBy: {
              updatedAt: 'desc' // Use existing field instead of lastActivityAt
            }
          });
          
          if (cartSession) {
            await prisma.cartSession.update({
              where: { id: cartSession.id },
              data: {
                status: 'converted',
                convertedToOrderId: cartOrder.id
              }
            });
            console.log('✅ Корзина помечена как оплаченная:', cartSession.id);
          }
        } catch (cartError) {
          console.error('Ошибка обновления статуса корзины:', cartError);
        }
        
        // Send browser notification to admin (we'll implement this next)
        try {
          // Try to send notification via WebSocket or Push API
          const notificationData = {
            type: 'new_order',
            title: '🛍️ New Order Received!',
            message: `Order ${orderReference} from ${clientFirstName || 'Customer'} ${clientLastName || ''} for ${currency} ${amount}`,
            orderId: cartOrder.id,
            timestamp: new Date().toISOString()
          };
          
          // Store notification in database for admin panel
          await prisma.payment.create({
            data: {
              userId: payment.userId,
              amount: 0.01, // Small amount to indicate notification
              currency: 'NOTIFICATION',
              status: 'NEW_ORDER',
              description: JSON.stringify(notificationData),
              wayforpayOrderReference: `NOTIF_${orderReference}`
            }
          });
          
          console.log('📢 Admin notification created');
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
        
      } catch (orderError) {
        console.error('❌ Failed to create order:', orderError);
        // Order creation failed but payment was successful - log for manual review
        console.error('CRITICAL: Payment successful but order creation failed!');
        console.error('Order data:', {
          orderReference,
          amount,
          currency,
          clientEmail,
          items: productName
        });
      }
    } else {
      console.log('❌ Cart payment failed:', reasonCode);
    }
    
    // Send response to WayForPay
    const responseData = {
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000)
    };
    
    const responseSignature = crypto.createHmac('md5', MERCHANT_SECRET)
      .update([MERCHANT_LOGIN, responseData.orderReference, responseData.status].join(';'))
      .digest('hex');
    
    responseData.signature = responseSignature;
    
    console.log('📤 Sending cart callback response:', responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Cart callback processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cart callback processing failed' 
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🔄 Attempting to cancel subscription for user: ${userId}`);
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription) {
      console.log('❌ No subscription found for user');
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }
    
    if (subscription.status !== 'ACTIVE') {
      console.log(`❌ Subscription already ${subscription.status}`);
      return res.status(400).json({
        success: false,
        message: `Subscription is already ${subscription.status.toLowerCase()}`
      });
    }
    
    console.log(`🎯 Cancelling ${subscription.plan} subscription...`);
    console.log(`📊 Before update - Status: ${subscription.status}, Plan: ${subscription.plan}`);
    
    // Use transaction to ensure atomic database update
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription status and plan atomically
      const updatedSubscription = await tx.subscription.update({
        where: { userId },
        data: {
          status: 'CANCELLED',
          plan: 'FREE',
          cancelledAt: new Date(),
          // Disable recurring payments
          isRecurring: false,
          nextPaymentDate: null,
          failedPaymentAttempts: 0
        }
      });
      
      console.log(`📊 After update - Status: ${updatedSubscription.status}, Plan: ${updatedSubscription.plan}`);
      console.log('✅ Subscription status updated to CANCELLED in database');
      
      // Get updated user data with subscription
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });
      
      // Verify the update was successful
      if (updatedUser.subscription.status !== 'CANCELLED' || updatedUser.subscription.plan !== 'FREE') {
        console.error('❌ Database update verification failed!');
        console.error(`   Expected: Status=CANCELLED, Plan=FREE`);
        console.error(`   Actual: Status=${updatedUser.subscription.status}, Plan=${updatedUser.subscription.plan}`);
        throw new Error('Subscription update verification failed');
      }
      
      console.log('✅ Database update verification successful');
      return { updatedSubscription, updatedUser };
    });
    
    console.log('🔄 Attempting to cancel WayForPay subscription...');
    
    // WayForPay subscription cancellation API call using REMOVE request
    let wayforpaySuccess = false;
    try {
      const orderReference = subscription.wayforpayOrderReference;
      
      if (!orderReference) {
        console.log('⚠️ No WayForPay orderReference found for this subscription');
        console.log('- This subscription may be from before orderReference storage was implemented');
        console.log('- Subscription cancelled in database but WayForPay payment remains active');
      } else {
        console.log(`🎯 Cancelling WayForPay subscription with orderReference: ${orderReference}`);
        
        // Generate signature for REMOVE request
        const merchantSignature = generateRemoveSignature(orderReference);
        
        const removeRequestData = {
          requestType: 'REMOVE',
          merchantAccount: MERCHANT_LOGIN,
          merchantPassword: MERCHANT_PASSWORD,
          orderReference: orderReference,
          merchantSignature: merchantSignature
        };
        
        console.log('📤 Sending REMOVE request to WayForPay:', {
          ...removeRequestData,
          merchantPassword: '[MASKED]'
        });
        
        const wayforpayResponse = await fetch('https://api.wayforpay.com/regularApi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(removeRequestData)
        });
        
        const responseData = await wayforpayResponse.json();
        console.log('📥 WayForPay REMOVE response:', responseData);
        
        if (responseData.reasonCode === 4100 && responseData.reason === 'Ok') {
          console.log('✅ WayForPay subscription successfully cancelled');
          wayforpaySuccess = true;
        } else {
          console.log('❌ WayForPay cancellation failed:', responseData.reason);
          console.log('- Local subscription cancelled but WayForPay subscription may still be active');
        }
      }
      
    } catch (error) {
      console.error('❌ WayForPay cancellation error:', error);
      console.log('- Local subscription cancelled but WayForPay API call failed');
    }
    
    // Final verification log
    console.log('🏁 Final cancellation result:');
    console.log(`   ✅ Database: Status=${result.updatedUser.subscription.status}, Plan=${result.updatedUser.subscription.plan}`);
    console.log(`   ${wayforpaySuccess ? '✅' : '❌'} WayForPay: ${wayforpaySuccess ? 'Successfully cancelled' : 'Failed or no orderReference'}`);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      user: result.updatedUser
    });
    
  } catch (error) {
    console.error('❌ Cancellation error:', error);
    
    // If there was a database transaction error, try to clean up any partial state
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id }
      });
      
      if (subscription && subscription.cancelledAt && subscription.status === 'ACTIVE') {
        console.log('🔧 Detected partial cancellation - attempting cleanup...');
        await prisma.subscription.update({
          where: { userId: req.user.id },
          data: {
            status: 'CANCELLED',
            plan: 'FREE'
          }
        });
        console.log('✅ Cleanup successful - subscription properly cancelled');
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel subscription' 
    });
  }
};