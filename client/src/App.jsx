import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/Layout';
import LocalizedRoutes from './components/LocalizedRoutes';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Layout>
      <LocalizedRoutes />
    </Layout>
  );
}

export default App;