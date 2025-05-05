import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from 'common';

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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
    
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
      localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
