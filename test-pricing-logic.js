/**
 * Test script for pricing page button logic
 * Run this in the browser console after logging in
 */

// Test different user plan scenarios
const testScenarios = [
  { plan: 'FREE', description: 'Free user' },
  { plan: 'BASIC', description: 'Basic subscriber' },
  { plan: 'PRO', description: 'Pro subscriber' },
  { plan: 'ENTERPRISE', description: 'Enterprise subscriber' }
];

const testPricingLogic = async () => {
  console.log('🧪 Testing Pricing Page Button Logic\n');
  
  const API_BASE = window.location.origin + '/api';
  
  // Get auth token from localStorage or wherever it's stored
  const authToken = localStorage.getItem('authToken') || 'your-token-here';
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing scenario: ${scenario.description} (${scenario.plan})`);
    
    try {
      // Set user plan
      const response = await fetch(`${API_BASE}/test/set-user-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          plan: scenario.plan,
          status: 'ACTIVE'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ User plan set to ${scenario.plan}`);
        console.log(`   Credits: ${result.user.totalCredits}`);
        console.log(`   Subscription: ${result.user.subscription?.plan || 'None'}`);
        console.log(`   Status: ${result.user.subscription?.status || 'None'}`);
        console.log('   👆 Go to /pricing page to see button behavior');
        
        // Wait for user to check the pricing page
        await new Promise(resolve => {
          const button = document.createElement('button');
          button.textContent = `✅ Checked pricing page for ${scenario.plan}? Click to continue`;
          button.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;';
          button.onclick = () => {
            document.body.removeChild(button);
            resolve();
          };
          document.body.appendChild(button);
        });
        
      } else {
        console.error(`❌ Failed to set plan: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${scenario.plan}:`, error);
    }
  }
  
  console.log('\n🎉 Testing completed! Expected behavior:');
  console.log('FREE user: All paid plans show "Upgrade Now" (green/blue buttons)');
  console.log('BASIC user: FREE shows "Get Started", BASIC shows "Current Plan" (disabled), higher plans show "Upgrade Now"');
  console.log('PRO user: Lower plans show "Downgrade Locked" (disabled), PRO shows "Current Plan", ENTERPRISE shows "Upgrade Now"');
  console.log('ENTERPRISE user: All lower plans show "Downgrade Locked" (disabled), ENTERPRISE shows "Current Plan"');
};

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions for Pricing Logic:

1. Make sure you're logged in to the application
2. Open browser console and run: testPricingLogic()
3. The script will cycle through different user plans
4. For each plan, go to /pricing page and verify button behavior
5. Click the green button to continue to next scenario

🎯 Expected Button Behavior:

Current Plan: "Current Plan" (disabled, blue)
Higher Plans: "Upgrade Now" (enabled, green/blue)  
Lower Plans (with active subscription): "Downgrade Locked" (disabled, gray)
Lower Plans (no subscription): "Subscribe Now" (enabled)
FREE Plan: "Get Started" (always enabled)

💡 Button Messages:
✓ Current Plan
📈 Upgrade anytime  
🔒 Can change after subscription expires

🛠 Manual Test Cases:
1. FREE → All paid plans show "Upgrade Now"
2. BASIC → FREE "Get Started", BASIC "Current Plan", PRO/ENTERPRISE "Upgrade Now"  
3. PRO → Lower plans "Downgrade Locked", PRO "Current Plan", ENTERPRISE "Upgrade Now"
4. ENTERPRISE → All lower plans "Downgrade Locked", ENTERPRISE "Current Plan"
`);

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('Ready to test! Run testPricingLogic() in console');
  window.testPricingLogic = testPricingLogic;
}