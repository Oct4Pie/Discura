/**
 * Authentication Module Interface for TSOA
 * 
 * This file provides a placeholder implementation of the expressAuthentication function
 * that TSOA needs for type generation. At runtime, the backend will provide the actual
 * implementation with JWT verification logic.
 * 
 * This allows common package to be built independently of backend.
 */
import { AuthenticationFunction } from '../types/auth';

/**
 * TSOA Authentication Function - Type Definition Only
 * 
 * This is a placeholder that allows TSOA to compile routes without backend dependencies.
 * The actual implementation is provided by backend/src/middlewares/authentication.ts
 */
export const expressAuthentication: AuthenticationFunction = async (
  request, 
  securityName,
  scopes
) => {
  // This is a placeholder implementation that should never be called at runtime
  // The backend will provide the real implementation
  throw new Error(
    'This is a placeholder implementation for type generation only. ' +
    'The backend should provide the actual implementation.'
  );
};