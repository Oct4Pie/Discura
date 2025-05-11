// Re-export all generated API types and services
export * from "./generated";

// Import OpenAPI configuration for setup
import { OpenAPI } from './generated/core/OpenAPI';
import { useAuthStore } from '../stores/authStore';
import { AuthenticationService } from './generated';

// Configure the OpenAPI client
OpenAPI.BASE = '/api';
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';

// Replace TOKEN resolver to return only the raw token without 'Bearer ' prefix
OpenAPI.TOKEN = async () => {
  const token = useAuthStore.getState().token;
  console.log('[API] TOKEN resolver raw token:', token ? '[TOKEN_HIDDEN]' : 'No token');
  return token || '';
};

// Export a function to manually set auth headers on the generated client
export const configureAuthHeaders = (token: string | null) => {
  if (token) {
    // Just setting the token in the store is enough
    // The TOKEN resolver above will handle adding it to requests
    console.log('[API] Auth headers configured with token');
  } else {
    console.log('[API] Auth headers cleared (no token)');
  }
};

console.log('API client configured with authentication token resolver');