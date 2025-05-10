/**
 * Reference declaration file to help TypeScript resolve 'routes' module paths
 * if they are being treated as implicit type libraries.
 * 
 * Following Discura Project Guidelines to maintain a single source of truth
 */

/// <reference types="@discura/common/routes" />

// Export all types from @discura/common/routes
declare module 'routes' {
  export * from '@discura/common/routes';
}