import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get credentials from environment
const MERCHANT_LOGIN = process.env.WAYFORPAY_MERCHANT_LOGIN;
const MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET;
const MERCHANT_PASSWORD = process.env.WAYFORPAY_MERCHANT_PASSWORD;

// Plan configurations
const PLAN_CONFIG = {
  BASIC: {
    amount: 400,
    credits: 100,
    name: 'Basic Plan',
    buttonUrl: process.env.WAYFORPAY_BASIC_BUTTON_URL
  },
  PRO: {
    amount: 1200,
    credits: 500,
    name: 'Pro Plan',
    buttonUrl: process.env.WAYFORPAY_PRO_BUTTON_URL
  },
  ENTERPRISE: {
    amount: 4000,
    credits: 2000,
    name: 'Enterprise Plan',
    buttonUrl: process.env.WAYFORPAY_ENTERPRISE_BUTTON_URL
  }
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
        orderId: orderReference,
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
    const {
      orderReference,
      status,
      time,
      signature,
      amount,
      currency,
      transactionStatus,
      reasonCode,
      reason
    } = req.body;
    
    // Verify signature
    const expectedSignature = generateSignature({
      orderReference,
      amount,
      currency,
      productName: req.body.productName?.[0],
      productCount: 1,
      productPrice: amount
    });
    
    if (signature !== expectedSignature) {
      console.error('Invalid signature in callback');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId: orderReference }
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Update payment status
    if (transactionStatus === 'Approved') {
      // Payment successful
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: req.body.transactionId
        }
      });
      
      // Update user subscription
      const planType = amount === 400 ? 'BASIC' : 
                      amount === 1200 ? 'PRO' : 
                      amount === 4000 ? 'ENTERPRISE' : 'BASIC';
      
      await prisma.subscription.upsert({
        where: { userId: payment.userId },
        update: {
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        create: {
          userId: payment.userId,
          plan: planType,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      // Add credits to user
      const credits = PLAN_CONFIG[planType].credits;
      await prisma.credit.create({
        data: {
          userId: payment.userId,
          amount: credits,
          type: 'PURCHASE',
          description: `${planType} plan subscription`
        }
      });
      
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED'
        }
      });
    }
    
    // Send response to WayForPay
    res.json({
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000),
      signature: generateSignature({ orderReference, status: 'accept' })
    });
    
  } catch (error) {
    console.error('Callback processing error:', error);
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
    
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
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