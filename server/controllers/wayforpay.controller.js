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
  // WayForPay callback signature format
  const signString = [
    MERCHANT_LOGIN,
    data.orderReference,
    data.amount,
    data.currency
  ].join(';');
  
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
    
    const {
      orderReference,
      status,
      time,
      signature,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      reason,
      clientEmail,
      clientFirstName,
      clientLastName
    } = req.body;
    
    // Verify signature for callback
    const expectedSignature = generateCallbackSignature({
      orderReference,
      amount,
      currency
    });
    
    console.log('Signature verification:', {
      received: signature,
      expected: expectedSignature,
      orderReference,
      amount,
      currency,
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
      
      // Update user subscription
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        create: {
          userId: user.id,
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }
    
    // Update subscription status
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED'
      }
    });
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel subscription' 
    });
  }
};