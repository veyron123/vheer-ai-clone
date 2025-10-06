import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/Layout';
import LocalizedRoutes from './components/LocalizedRoutesOptimized';
import { useGlobalAnalytics } from './hooks/useGlobalAnalytics';

// Analytics
import FacebookPixel from './components/analytics/FacebookPixel';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  // 📊 Initialize global analytics
  useGlobalAnalytics();

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <FacebookPixel />
      <Layout>
        <LocalizedRoutes />
      </Layout>
    </>
  );
}

export default App;