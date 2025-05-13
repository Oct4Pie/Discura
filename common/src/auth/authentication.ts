/**
 * Authentication Module Interface for TSOA
 *
 * This file provides a placeholder implementation of the expressAuthentication function
 * that TSOA needs for type generation. At runtime, the backend will provide the actual
 * implementation with JWT verification logic.
 *
 * This allows common package to be built independently of backend.
 */
import { Request } from "express";

import { AuthenticationFunction } from "../types/auth";

/**
 * Runtime injection mechanism for TSOA authentication
 *
 * This variable will hold the actual implementation provided by the backend.
 * If no implementation is injected, the placeholder will be used (and throw an error).
 */
let authImplementation: AuthenticationFunction | null = null;

/**
 * Set the authentication implementation at runtime
 *
 * The backend should call this function at startup to provide the actual
 * implementation of the authentication function.
 *
 * @param implementation The actual authentication function implementation
 */
export function setAuthImplementation(
  implementation: AuthenticationFunction,
): void {
  authImplementation = implementation;
  console.log("Authentication implementation has been set");
}

/**
 * TSOA Authentication Function
 *
 * This is the function that TSOA will call for authentication. It delegates to
 * the implementation provided by the backend via setAuthImplementation, or falls
 * back to a placeholder that throws an error if no implementation is provided.
 */
export const expressAuthentication: AuthenticationFunction = async (
  request: Request,
  securityName: string,
  scopes?: string[],
) => {
  // If an implementation has been provided, use it
  if (authImplementation) {
    return authImplementation(request, securityName, scopes);
  }

  // Otherwise, use the placeholder implementation
  throw new Error(
    "This is a placeholder implementation for type generation only. " +
      "The backend should provide the actual implementation using setAuthImplementation().",
  );
};
