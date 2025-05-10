/**
 * Reference declaration file to help TypeScript resolve 'schema' module paths
 * if they are being treated as implicit type libraries.
 * 
 * Following Discura Project Guidelines to maintain a single source of truth
 */

/// <reference types="@discura/common/schema" />

// Export all types from @discura/common/schema
declare module 'schema' {
  export * from '@discura/common/schema';
}