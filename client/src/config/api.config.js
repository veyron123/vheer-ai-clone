// API Configuration
const DEFAULT_REMOTE_FALLBACK = 'https://colibrrri-fullstack.onrender.com/api';

const stripTrailingSlash = (value) => value?.replace(/\/+$/, '') || '';

const parseBooleanEnv = (value) => value === 'true';

const isWindowAvailable = typeof window !== 'undefined';

const isLocalHostname = (hostname) => {
  if (!hostname) {
    return false;
  }

  const lowered = hostname.toLowerCase();
  return (
    lowered === 'localhost' ||
    lowered === '127.0.0.1' ||
    lowered === '::1' ||
    lowered.endsWith('.local')
  );
};

const isLocalUrl = (value) => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return isLocalHostname(url.hostname);
  } catch (error) {
    // Non-absolute URLs (e.g. "/api") should be treated as remote-safe overrides
    return false;
  }
};

const shouldUseLocalApi = () => {
  if (parseBooleanEnv(import.meta.env.VITE_USE_LOCAL_API)) {
    return true;
  }

  if (import.meta.env.MODE === 'development') {
    return true;
  }

  if (isWindowAvailable && isLocalHostname(window.location.hostname)) {
    return true;
  }

  return false;
};

const resolveLocalBase = () => {
  const envBase = stripTrailingSlash(import.meta.env.VITE_API_URL);
  if (envBase && isLocalUrl(envBase)) {
    return envBase;
  }

  return 'http://localhost:5000/api';
};

const resolveRemoteBase = () => {
  const envBase = stripTrailingSlash(import.meta.env.VITE_API_URL);
  if (envBase && !isLocalUrl(envBase)) {
    return envBase;
  }

  const remoteEnv = stripTrailingSlash(import.meta.env.VITE_REMOTE_API_URL);
  if (remoteEnv && !isLocalUrl(remoteEnv)) {
    return remoteEnv;
  }

  if (isWindowAvailable && !isLocalHostname(window.location.hostname)) {
    const origin = stripTrailingSlash(window.location.origin);
    if (origin) {
      return `${origin}/api`;
    }
  }

  return DEFAULT_REMOTE_FALLBACK;
};

const resolveBaseUrl = () => (shouldUseLocalApi() ? resolveLocalBase() : resolveRemoteBase());

export const API_CONFIG = {
  get baseURL() {
    return resolveBaseUrl();
  },

  timeout: 30000,

  headers: {
    'Content-Type': 'application/json'
  }
};

// OAuth URLs configuration
const resolveOAuthBase = () => {
  if (shouldUseLocalApi()) {
    return 'http://localhost:5000';
  }

  const remoteBase = resolveRemoteBase();
  const withoutApi = remoteBase.replace(/\/api$/, '');
  return withoutApi || remoteBase;
};

export const OAUTH_CONFIG = {
  get googleURL() {
    return `${resolveOAuthBase()}/auth/google`;
  },
  get facebookURL() {
    return `${resolveOAuthBase()}/auth/facebook`;
  }
};

export const getApiUrl = (endpoint) => `${resolveBaseUrl()}${endpoint}`;
