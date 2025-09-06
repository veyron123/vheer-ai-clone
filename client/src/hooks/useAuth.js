import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const loading = useAuthStore(state => state.loading);
  const error = useAuthStore(state => state.error);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const checkAuth = useAuthStore(state => state.checkAuth);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth
  };
};

export default useAuth;