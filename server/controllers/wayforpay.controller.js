import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get credentials from environment
const MERCHANT_LOGIN = process.env.WAYFORPAY_MERCHANT_LOGIN;
const MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET;
const MERCHANT_PASSWORD = process.env.WAYFORPAY_MERCHANT_PASSWORD;

// Plan configurations with updated credit amounts
const PLAN_CONFIG = {
  BASIC: {
    amount: 400,
    credits: 800,
    name: 'Basic Plan',
    buttonUrl: process.env.WAYFORPAY_BASIC_BUTTON_URL
  },
  PRO: {
    amount: 1200,
    credits: 3000,
    name: 'Pro Plan',
    buttonUrl: process.env.WAYFORPAY_PRO_BUTTON_URL
  },
  ENTERPRISE: {
    amount: 4000,
    credits: 15000,
    name: 'Максимальний Plan',
    buttonUrl: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL
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
    const { planId } = req.body;
    const userId = req.user.id;
    
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
      returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
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
      clientLastName
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
      clientLastName
    });
    
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
    
    // Find user by email or create if not exists
    const userEmail = clientEmail || req.body.clientEmail;
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      // Create user if doesn't exist
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
    }
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        currency,
        status: transactionStatus === 'Approved' ? 'COMPLETED' : 'FAILED',
        description: `WayForPay payment - ${orderReference}`
      }
    });
    
    console.log('✅ Payment record created:', payment.id);
    
    // Process successful payment
    if (transactionStatus === 'Approved') {
      // Determine plan type and credits
      const planType = amount == 400 ? 'BASIC' : 
                      amount == 1200 ? 'PRO' : 
                      amount == 4000 ? 'ENTERPRISE' : 'BASIC';
      
      const credits = PLAN_CONFIG[planType].credits;
      
      console.log(`💰 Processing payment: ${planType} plan, ${credits} credits`);
      
      // Update user subscription and save orderReference for future cancellation
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          wayforpayOrderReference: orderReference
        },
        create: {
          userId: user.id,
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          wayforpayOrderReference: orderReference
        }
      });
      
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
    
    // Update subscription status and plan
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        plan: 'FREE',
        cancelledAt: new Date()
      }
    });
    
    console.log('✅ Subscription status updated to CANCELLED in database');
    
    // Get updated user data with subscription
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
    
    console.log('🔄 Attempting to cancel WayForPay subscription...');
    
    // WayForPay subscription cancellation API call using REMOVE request
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
        } else {
          console.log('❌ WayForPay cancellation failed:', responseData.reason);
          console.log('- Local subscription cancelled but WayForPay subscription may still be active');
        }
      }
      
    } catch (error) {
      console.error('❌ WayForPay cancellation error:', error);
      console.log('- Local subscription cancelled but WayForPay API call failed');
    }
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel subscription' 
    });
  }
};