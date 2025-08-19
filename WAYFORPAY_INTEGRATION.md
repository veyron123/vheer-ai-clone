# WayForPay Payment Integration Documentation

## 🔒 Security Notice
**IMPORTANT**: All merchant credentials are stored in environment variables and should NEVER be committed to version control.

## 📋 Overview
This document describes the integration of WayForPay payment system for the Vheer Clone project.

### Supported Features:
- ✅ One-time payments for subscription plans
- 🔄 Recurring payments (subscription-based)
- 🇺🇦 Ukrainian market focus (UAH currency)

## 🔑 Configuration

### Environment Variables
The following environment variables must be set in the `.env` file:

```env
WAYFORPAY_MERCHANT_LOGIN="your_merchant_login"
WAYFORPAY_MERCHANT_SECRET="your_merchant_secret_key"
WAYFORPAY_MERCHANT_PASSWORD="your_merchant_password"
WAYFORPAY_BASIC_BUTTON_URL="https://secure.wayforpay.com/button/..."
```

## 💳 Subscription Plans

### Available Plans (Ukrainian Market)

| Plan | Price (UAH) | Credits | Billing |
|------|------------|---------|---------|
| Free | ₴0 | 100/day | N/A |
| Basic | ₴400 | 100/month | Monthly |
| Pro | ₴1200 | 500/month | Monthly |
| Enterprise | ₴4000 | 2000/month | Monthly |

## 🔗 Payment Flow

### 1. Initial Payment
1. User selects a plan on pricing page
2. System generates payment request with unique order ID
3. User redirected to WayForPay payment page
4. After payment, user returns to success/failure page
5. System receives callback from WayForPay
6. Subscription activated upon successful payment

### 2. Recurring Payments
- Automatically charged monthly
- User can cancel anytime from profile
- Failed payments trigger retry mechanism
- Email notifications for payment events

## 📡 API Endpoints

### Server Endpoints

#### Initialize Payment
```
POST /api/payments/wayforpay/init
```
Request body:
```json
{
  "planId": "BASIC|PRO|ENTERPRISE",
  "userId": "user_id"
}
```

#### Handle Callback
```
POST /api/payments/wayforpay/callback
```
WayForPay will send payment status to this endpoint.

#### Check Payment Status
```
GET /api/payments/wayforpay/status/:orderId
```

#### Cancel Subscription
```
POST /api/payments/wayforpay/cancel
```

## 🛠️ Implementation Details

### Server-side Files
- `/server/controllers/wayforpay.controller.js` - Payment logic
- `/server/routes/wayforpay.routes.js` - API routes
- `/server/services/wayforpay.service.js` - WayForPay API integration
- `/server/utils/wayforpay.utils.js` - Helper functions

### Client-side Files
- `/client/src/pages/PricingPage.jsx` - Updated with payment buttons
- `/client/src/services/payment.service.js` - Payment API calls
- `/client/src/pages/PaymentSuccess.jsx` - Success page
- `/client/src/pages/PaymentFailure.jsx` - Failure page

## 🔐 Security Measures

1. **Signature Verification**: All requests are signed with merchant secret
2. **HTTPS Only**: All payment communications over HTTPS
3. **Order Validation**: Unique order IDs prevent replay attacks
4. **Amount Verification**: Server validates payment amounts
5. **IP Whitelisting**: Only accept callbacks from WayForPay IPs

## 📊 Database Schema

### Payment Records
```sql
payments {
  id: string (UUID)
  userId: string
  orderId: string (unique)
  planId: string
  amount: number
  currency: string
  status: enum (pending, success, failed, refunded)
  wayforpayTransactionId: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Subscription Updates
Upon successful payment, update user subscription:
- Plan type
- Expiry date
- Credits allocation
- Payment history

## 🧪 Testing

### Test Cards (Sandbox Mode)
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1112

### Test Scenarios
1. Successful one-time payment
2. Failed payment
3. Recurring payment setup
4. Subscription cancellation
5. Webhook handling

## 📝 Error Handling

### Common Error Codes
- `1001` - Invalid signature
- `1002` - Payment already processed
- `1003` - Invalid amount
- `1004` - User not found
- `1005` - Plan not available

## 🔄 Webhook Events

### Supported Events
- `payment.success` - Payment completed
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded
- `subscription.created` - Recurring payment setup
- `subscription.cancelled` - Subscription cancelled

## 📱 User Interface

### Payment Button Integration
For Ukrainian version only:
- Shows UAH prices
- Links to WayForPay checkout
- Displays payment status
- Shows subscription details

## 🚀 Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure webhook URL in WayForPay dashboard
- [ ] Enable production mode
- [ ] Test payment flow
- [ ] Monitor error logs
- [ ] Set up email notifications

## 📞 Support

### WayForPay Support
- Documentation: https://wiki.wayforpay.com/
- Support Email: support@wayforpay.com

### Internal Support
- Check server logs: `/logs/wayforpay.log`
- Database: Check `payments` table
- Error tracking: Monitor error codes

---

**Last Updated**: 2025-08-19
**Version**: 1.0.0