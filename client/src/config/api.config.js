// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.PROD;

console.log('Environment check:', {
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API,
  isDevelopment,
  isProduction
});

// Support both local and remote server
const useLocalAPI = import.meta.env.VITE_USE_LOCAL_API === 'true' || isDevelopment;

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || (useLocalAPI 
    ? 'http://localhost:5000/api' 
    : 'https://colibrrri.com/api'),
  
  timeout: 30000,
  
  headers: {
    'Content-Type': 'application/json',
  },
};

// OAuth URLs configuration  
export const OAUTH_CONFIG = {
  googleURL: useLocalAPI 
    ? 'http://localhost:5000/auth/google'
    : 'https://colibrrri.com/auth/google',
  facebookURL: useLocalAPI 
    ? 'http://localhost:5000/auth/facebook' 
    : 'https://colibrrri.com/auth/facebook'
};

console.log('API Config:', API_CONFIG);
console.log('OAuth Config:', OAUTH_CONFIG);

export const getApiUrl = (endpoint) => {
  const baseURL = API_CONFIG.baseURL;
  return `${baseURL}${endpoint}`;
};