/**
 * Routes index file
 * 
 * This file re-exports the TSOA-generated routes and route constants.
 * It serves as the central access point for all route-related exports.
 * 
 * IMPORTANT: Do NOT import route constants from here for use in TSOA decorators.
 * For TSOA decorators, use string literals that match the constants defined in routes.constants.ts.
 */

// Re-export route constants from the single source of truth
export * from '../types/routes';

// Export RegisterRoutes function from TSOA-generated routes
export { RegisterRoutes } from './routes';