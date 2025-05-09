/**
 * API Types
 * 
 * This file re-exports the API types from common/schema/types.ts
 * Do NOT define any types directly in this file.
 * 
 * API types should be defined in common/src/types/api/ folder with @tsoaModel decorator,
 * then they will be automatically generated into common/schema/types.ts by the generate-api-types.sh script.
 */

// Re-export all generated API types from the schema
export * from '../schema/types';

