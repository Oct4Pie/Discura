/**
 * Reference declaration file to help TypeScript resolve 'auth' module paths
 * if they are being treated as implicit type libraries.
 * 
 * Following Discura Project Guidelines to maintain a single source of truth
 */

/// <reference types="@discura/common/auth" />

// Export all types from @discura/common/auth
declare module 'auth' {
  export * from '@discura/common/auth';
}