# 🚨 Production Payment Integration Fix

## Problem Identified
Production server is using old/invalid WayForPay payment URLs, causing "Unable to make a payment" errors.

## Root Cause
1. **Missing environment variables** on Render.com for PRO and ENTERPRISE plans
2. **BASIC plan using old URL** `b85dd73ba8317` which was already paid/expired
3. **Environment variables not synced** between local `.env` and production

## Fix Required on Render.com Dashboard

### 1. Go to Render.com Dashboard
- Navigate to: https://dashboard.render.com
- Select the `colibrrri-fullstack` service

### 2. Update Environment Variables
Add/update these environment variables in the service settings:

#### WayForPay Credentials:
```
WAYFORPAY_MERCHANT_LOGIN=colibrrri_com
WAYFORPAY_MERCHANT_SECRET=ccd5a7d7ec3063cc8b616a6c90e686da5362c203
WAYFORPAY_MERCHANT_PASSWORD=8086548cb22812c22b606f21ee675a87
```

#### English Version Payment URLs:
```
WAYFORPAY_BASIC_BUTTON_URL=https://secure.wayforpay.com/button/b22dba93721e3
WAYFORPAY_PRO_BUTTON_URL=https://secure.wayforpay.com/button/bcb8a5a42c05f
WAYFORPAY_ENTERPRISE_BUTTON_URL=https://secure.wayforpay.com/button/bd36297803462
```

#### Ukrainian Version Payment URLs:
```
WAYFORPAY_BASIC_BUTTON_URL_UK=https://secure.wayforpay.com/button/bcdf0c219984e
WAYFORPAY_PRO_BUTTON_URL_UK=https://secure.wayforpay.com/button/bc832264fe106
WAYFORPAY_ENTERPRISE_BUTTON_URL_UK=https://secure.wayforpay.com/button/b8ad589698312
```

### 3. Deploy Changes
After adding environment variables, trigger a manual redeploy or push a commit to trigger auto-deploy.

## Expected Results After Fix

### Before Fix (Current Production):
- ❌ BASIC: Uses old URL `b85dd73ba8317` → "Already paid" error
- ❌ PRO: No `paymentUrl` → Shows "Payment integration coming soon!"  
- ❌ ENTERPRISE: No `paymentUrl` → Shows "Payment integration coming soon!"

### After Fix:
- ✅ BASIC: Uses new URL `b22dba93721e3` → Works correctly
- ✅ PRO: Uses URL `bcb8a5a42c05f` → Redirects to WayForPay
- ✅ ENTERPRISE: Uses URL `bd36297803462` → Redirects to WayForPay

## Verification Commands

Test production API after fix:
```bash
# Test English version
curl -s "https://colibrrri-fullstack.onrender.com/api/subscriptions/plans?lang=en" | jq '.[] | {id, paymentUrl}'

# Test Ukrainian version  
curl -s "https://colibrrri-fullstack.onrender.com/api/subscriptions/plans?lang=uk" | jq '.[] | {id, paymentUrl}'
```

Expected output should include `paymentUrl` for all paid plans (BASIC, PRO, ENTERPRISE).

## URLs to Test After Fix

- English pricing: https://colibrrri.com/en/pricing
- Ukrainian pricing: https://colibrrri.com/uk/pricing

All "Upgrade Plan" buttons should redirect to WayForPay payment pages instead of showing error messages.

---

**Status**: Ready for production deployment
**Date**: 2025-08-29
**Priority**: HIGH - Payment system broken on production