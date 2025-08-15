import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/Layout';
import LocalizedRoutes from './components/LocalizedRoutes';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Layout>
      <LocalizedRoutes />
    </Layout>
  );
}

export default App;