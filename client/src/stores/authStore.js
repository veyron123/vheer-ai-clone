import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { OAUTH_CONFIG } from '../config/api.config';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return response.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return response.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        
        delete api.defaults.headers.common['Authorization'];
      },
      
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },
      
      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          set({ 
            user: response.data, 
            isAuthenticated: true,
            totalCredits: response.data.totalCredits 
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          get().logout();
        }
      },

      // Set authentication data (for OAuth)
      setAuthData: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      // OAuth login methods
      loginWithGoogle: () => {
        window.location.href = OAUTH_CONFIG.googleURL;
      },

      loginWithFacebook: () => {
        window.location.href = OAUTH_CONFIG.facebookURL;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in axios headers on store rehydration
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);