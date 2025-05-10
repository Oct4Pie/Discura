import axios, { AxiosError } from 'axios';
// Import storage keys from models in generated API
import { OpenAPI } from '../api/generated';

// Define storage keys constants
const STORAGE_KEYS = {
  AUTH_STORAGE: 'auth',
  USER_PREFERENCES: 'preferences',
  THEME_MODE: 'theme_mode',
  AUTH_TOKEN: 'auth_token',
  USER_PROFILE: 'user_profile'
};

/**
 * Set the authentication token for API requests
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    OpenAPI.TOKEN = token;
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    OpenAPI.TOKEN = '';
  }
};

/**
 * Get the authentication token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Initialize the API configuration
 */
export const initApiConfig = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    OpenAPI.TOKEN = token;
  }
  
  // Set base URL for API calls
  OpenAPI.BASE = '/api';
};

// Initialize on import
initApiConfig();

// Create a configured axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token to each request
api.interceptors.request.use(
  (config) => {
    // Use constant for local storage key
    const token = getAuthToken();
    
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.state?.token) {
          config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth token:', e);
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors in responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Use constant for local storage key
      setAuthToken(null);
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
