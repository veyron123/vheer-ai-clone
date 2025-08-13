import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api.config';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: API_CONFIG.timeout,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is set in authStore
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      toast.error('Please login to continue');
    } else if (error.response?.status === 403) {
      toast.error(message);
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;