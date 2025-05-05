/**
 * API Schema Exports
 * 
 * This file centralizes exports of API schema definitions.
 * The schema files (swagger.json and swagger.yaml) are generated
 * from the backend TSOA configuration during build.
 * 
 * IMPORTANT: The actual type definitions are maintained in the common/src/types/api.ts file,
 * which serves as the single source of truth for API types. This file simply re-exports
 * those types to maintain backwards compatibility and proper organization.
 */

// Re-export API types from our single source of truth
export * from '../types/api';

// Export any schema-specific utilities or constants here
export const SCHEMA_VERSION = '1.0.0';