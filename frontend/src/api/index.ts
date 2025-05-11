// Re-export all generated API types and services
export * from "./generated";

// Import OpenAPI configuration for setup
import { OpenAPI } from './generated/core/OpenAPI';
import { useAuthStore } from '../stores/authStore';

/**
 * Configure the OpenAPI client to use the authentication token from authStore
 * This ensures all API requests include the JWT token in the Authorization header
 */
export const setupApiClient = () => {
  // Set up a resolver to dynamically fetch the token on each request
  // The resolver must return a Promise as per the Resolver<string> type
  OpenAPI.TOKEN = async () => {
    const token = useAuthStore.getState().token;
    return token ? `Bearer ${token}` : '';
  };

  // Set credentials mode to include cookies
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';
  
  // Fix the BASE path setting to work with the Vite proxy
  // The Vite proxy will prepend '/api' to all requests
  OpenAPI.BASE = '/api';

  console.log('API client configured with authentication token resolver');
};

// Initialize API client configuration immediately
setupApiClient();