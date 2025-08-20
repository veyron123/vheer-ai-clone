/**
 * Test script for subscription expiry functionality
 * Run this with: node test-subscription-expiry.js
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// You'll need to replace this with a real auth token
const AUTH_TOKEN = 'your-auth-token-here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

const testSubscriptionExpiry = async () => {
  try {
    console.log('🧪 Testing Subscription Expiry System\n');

    // 1. Create a test subscription expiring in 1 day
    console.log('1️⃣ Creating test subscription expiring in 1 day...');
    const createResponse = await fetch(`${API_BASE}/test/create-test-subscription`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan: 'BASIC',
        daysFromNow: 1
      })
    });
    
    const createResult = await createResponse.json();
    console.log('   Result:', createResult);
    console.log('');

    // 2. Check current user subscription status
    console.log('2️⃣ Checking current subscription status...');
    const statusResponse = await fetch(`${API_BASE}/subscriptions/current`, {
      headers
    });
    
    const statusResult = await statusResponse.json();
    console.log('   Current subscription:', statusResult);
    console.log('');

    // 3. Set subscription to expire yesterday (simulate expiry)
    console.log('3️⃣ Setting subscription to expire yesterday...');
    const expireResponse = await fetch(`${API_BASE}/test/expire-subscription`, {
      method: 'POST',
      headers
    });
    
    const expireResult = await expireResponse.json();
    console.log('   Result:', expireResult);
    console.log('');

    // 4. Manually trigger expiry check
    console.log('4️⃣ Triggering manual expiry check...');
    const checkResponse = await fetch(`${API_BASE}/test/check-expired`, {
      method: 'POST',
      headers
    });
    
    const checkResult = await checkResponse.json();
    console.log('   Result:', checkResult);
    console.log('');

    // 5. Check subscription status after expiry
    console.log('5️⃣ Checking subscription status after expiry...');
    const finalStatusResponse = await fetch(`${API_BASE}/subscriptions/current`, {
      headers
    });
    
    const finalStatusResult = await finalStatusResponse.json();
    console.log('   Final subscription:', finalStatusResult);
    console.log('');

    console.log('✅ Test completed! The subscription should now be FREE with 100 credits.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Make sure the server is running: npm start
2. Login to the application and get your auth token from the browser dev tools
3. Replace AUTH_TOKEN in this script with your real token
4. Run this script: node test-subscription-expiry.js

🌐 Or test manually in the browser:
1. Go to http://localhost:5178/profile
2. Look for the subscription expiry date in the dashboard
3. For paid plans, you should see "expires [date]" or "X days left"

🔧 Cron Jobs:
- Expired subscriptions check: Every hour
- Expiring subscriptions notification: Daily at 9 AM

💡 Expected behavior:
- Paid plans show expiry date in dashboard
- After 30 days, plans automatically downgrade to FREE
- Credits reset to 100 when subscription expires
- Urgent warnings appear when subscription expires soon
`);

// Uncomment to run the test (after setting up AUTH_TOKEN)
// testSubscriptionExpiry();