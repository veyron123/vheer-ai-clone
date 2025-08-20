/**
 * Test script for upgrade popup functionality
 * Run this in the browser console after logging in
 */

const testUpgradePopup = async () => {
  console.log('🧪 Testing Upgrade Popup Functionality\n');
  
  const API_BASE = window.location.origin + '/api';
  
  // Test scenario: User with BASIC plan trying to upgrade to PRO
  console.log('📋 Testing scenario: BASIC user trying to upgrade to PRO');
  
  try {
    // Set user to BASIC plan with active subscription
    const response = await fetch(`${API_BASE}/test/set-user-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'BASIC',
        status: 'ACTIVE'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ User plan set to BASIC with ACTIVE subscription');
      console.log(`   Credits: ${result.user.totalCredits}`);
      console.log(`   Subscription: ${result.user.subscription?.plan || 'None'}`);
      console.log(`   Status: ${result.user.subscription?.status || 'None'}`);
      console.log('');
      
      console.log('🎯 Expected behavior on /pricing page:');
      console.log('   - FREE: "Get Started" (active)');
      console.log('   - BASIC: "Current Plan" (disabled, blue)');
      console.log('   - PRO: "Upgrade Plan" (active, will show popup)');
      console.log('   - ENTERPRISE: "Upgrade Plan" (active, will show popup)');
      console.log('');
      console.log('📝 Messages under buttons:');
      console.log('   - BASIC: "✓ Current Plan"');
      console.log('   - PRO/ENTERPRISE: "Cancel current subscription to upgrade" (orange)');
      console.log('');
      console.log('⚠️  When clicking PRO or ENTERPRISE "Upgrade Plan":');
      console.log('   - Should show red toast: "Please cancel your current subscription..."');
      console.log('   - Toast should last 6 seconds');
      console.log('   - Should NOT redirect to payment');
      console.log('');
      
      // Add a visual button to test
      const testButton = document.createElement('button');
      testButton.textContent = '🧪 Go to /pricing to test upgrade popup';
      testButton.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:15px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
      testButton.onclick = () => {
        window.location.href = '/pricing';
      };
      document.body.appendChild(testButton);
      
      // Remove button after 10 seconds
      setTimeout(() => {
        if (document.body.contains(testButton)) {
          document.body.removeChild(testButton);
        }
      }, 10000);
      
    } else {
      console.error(`❌ Failed to set plan: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing upgrade popup:`, error);
  }
};

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions for Upgrade Popup:

1. Make sure you're logged in to the application
2. Open browser console and run: testUpgradePopup()
3. Click the blue button to go to /pricing page
4. Try clicking "Upgrade Plan" on PRO or ENTERPRISE plans
5. Verify the red popup message appears

🎯 Expected Popup Messages:

Ukrainian: "Будь ласка, скасуйте поточну підписку, щоб підвищити план. Ваші поточні кредити зберігаються."

English: "Please cancel your current subscription to upgrade your plan. Your current credits will be preserved."

🔍 Visual Indicators:
- BASIC plan: "✓ Поточний план" (blue, disabled)
- Higher plans: "Скасуйте поточну підписку для підвищення" (orange text)
- Buttons remain active but show popup instead of redirecting

✅ Success Criteria:
1. ✅ Upgrade buttons remain clickable
2. ✅ Red toast popup appears with correct message
3. ✅ Toast lasts 6 seconds
4. ✅ No redirect to payment occurs
5. ✅ Message is in correct language (UK/EN)
6. ✅ Credits preservation message is included
`);

// Make function available globally
if (typeof window !== 'undefined') {
  window.testUpgradePopup = testUpgradePopup;
  console.log('Ready to test! Run testUpgradePopup() in console');
}