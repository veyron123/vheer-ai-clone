// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.PROD;

console.log('Environment check:', {
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  isDevelopment,
  isProduction
});

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || (isDevelopment 
    ? 'http://localhost:5000/api' 
    : 'https://colibrrri.com/api'), // Use production domain for deployed app
  
  timeout: 30000,
  
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('API Config:', API_CONFIG);

export const getApiUrl = (endpoint) => {
  const baseURL = API_CONFIG.baseURL;
  return `${baseURL}${endpoint}`;
};