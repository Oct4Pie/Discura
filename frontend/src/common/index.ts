/**
 * Frontend Common Module
 * 
 * This file serves as a bridge between the frontend and the common package.
 * It re-exports all necessary types, constants, and utilities from the common package
 * to ensure proper path resolution within the frontend.
 */

// Re-export types, constants and routes from common package
export * from '@discura/common/types';
export * from '@discura/common/constants';
export * from '@discura/common/types/routes';
