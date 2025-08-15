// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || (isDevelopment 
    ? 'http://localhost:5000/api' 
    : 'https://colibrrri.com/api'), // Use production domain for deployed app
  
  timeout: 30000,
  
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getApiUrl = (endpoint) => {
  const baseURL = API_CONFIG.baseURL;
  return `${baseURL}${endpoint}`;
};