import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/Layout';
import LocalizedRoutes from './components/LocalizedRoutesOptimized';
import { useGlobalAnalytics } from './hooks/useGlobalAnalytics';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const hasHydrated = useAuthStore(state => state.hasHydrated);
  
  // 📊 Initialize global analytics
  useGlobalAnalytics();

  // Check authentication on app load
  useEffect(() => {
    if (hasHydrated) {
      checkAuth();
    }
  }, [checkAuth, hasHydrated]);

  return (
    <Layout>
      <LocalizedRoutes />
    </Layout>
  );
}

export default App;
