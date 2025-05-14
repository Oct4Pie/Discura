// Re-export all generated API types and services
export * from "./generated";

// Import OpenAPI configuration for setup
import { OpenAPI } from './generated/core/OpenAPI';
import { useAuthStore } from '../stores/authStore';
import { AuthenticationService } from './generated';
import { toast } from 'react-toastify';

// Add ERROR property to the OpenAPI object directly
// This is a common pattern for extending objects from generated code
// TypeScript doesn't recognize this property by default, so we'll use a type assertion
type ExtendedOpenAPI = typeof OpenAPI & {
  ERROR?: (error: Response | Error) => Promise<any>;
};

// Interface for structured API errors coming from the backend
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  validationErrors?: string[];
  stack?: string;
}

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

// Add error handling middleware with proper typing
// Using type assertion to bypass TypeScript's type checking for the ERROR property
(OpenAPI as ExtendedOpenAPI).ERROR = async (error: Response | Error) => {
  console.error('[API Error]', error);
  
  try {
    if (error instanceof Response) {
      // Try to parse the error response as JSON to get structured error details
      const errorData = await error.json() as ApiError;
      
      // If we have structured error data, use it
      if (errorData && errorData.message) {
        // Get detailed error message
        let detailedMessage = errorData.message;
        
        // Log the complete error details for debugging
        console.log('[API Error Details]', {
          message: errorData.message,
          code: errorData.code,
          field: errorData.field,
          validationErrors: errorData.validationErrors
        });
        
        // Add field information if available
        if (errorData.field) {
          detailedMessage += ` (Field: ${errorData.field})`;
        }
        
        // Display validation errors if available
        if (errorData.validationErrors && errorData.validationErrors.length > 0) {
          const validationMessages = errorData.validationErrors.join('\n• ');
          detailedMessage += `\n\nValidation errors:\n• ${validationMessages}`;
        }
        
        // Always show a toast notification for immediate feedback
        // This ensures the user is aware of the error even if the ValidationErrorDisplay isn't visible
        toast.error(detailedMessage.split('\n')[0], {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Return structured error data for component handling
        return Promise.reject({
          message: detailedMessage,
          code: errorData.code || 'API_ERROR',
          field: errorData.field,
          validationErrors: errorData.validationErrors,
          status: error.status,
          original: error
        });
      }
    }
  } catch (parsingError) {
    console.error('[API Error Parsing Failed]', parsingError);
    // If parsing fails, continue with generic error handling
  }

  // Generic error handling for non-structured errors or parsing failures
  let statusCode: number | undefined;
  if (error instanceof Response) {
    statusCode = error.status;
  }
  
  let message = 'An error occurred while communicating with the server';
  
  if (statusCode === 401) {
    message = 'Authentication failed. Please log in again.';
    // Clear auth state on 401 Unauthorized
    useAuthStore.getState().logout();
  } else if (statusCode === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (statusCode === 404) {
    message = 'The requested resource was not found.';
  } else if (statusCode === 400) {
    message = 'The request was invalid. Please check your input.';
  } else if (statusCode === 500) {
    message = 'Server error. Please try again later.';
  }

  // Always display a toast notification for non-structured errors
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
  
  return Promise.reject({
    message,
    code: 'API_ERROR',
    status: statusCode,
    original: error
  });
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

// Helper function to handle API errors in components
export const handleApiError = (error: {
  message?: string;
  code?: string;
  field?: string;
  validationErrors?: string[];
  status?: number;
  original?: any;
}) => {
  const errorMessage = error.message || 'An unexpected error occurred';
  
  // Display a toast notification with the error message
  // (Only the first line of the error message to keep it concise)
  toast.error(errorMessage.split('\n')[0], {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
  
  // Return the error for further handling if needed
  return error;
};

console.log('API client configured with authentication token resolver and error handling');