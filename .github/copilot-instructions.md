# Discura Project Guidelines

## Table of Contents

- [Core Mandates](#core-mandates)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [API & Type System](#api--type-system)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Module Resolution](#module-resolution)
- [API Type Troubleshooting](#api-type-troubleshooting)
- [Project Status](#project-status)

## Core Mandates

> These rules are non-negotiable and must be followed without exception.

1. **Single Source of Truth:** Define API types in `common/src/types/api/` with `@tsoaModel` JSDoc tag, and routes in TSOA controllers. Use route constants.
2. **Use Generation Pipeline:** ALWAYS run `./generate-api-types.sh` after changing API types or controllers.
3. **NO Hard-Coding:** NEVER hard-code API paths or types. Use generated code and route constants.
4. **NO Editing Generated Files:** NEVER edit files created by the generation script.
5. **Common Package Centralization:** ALL code shared between frontend and backend MUST be in the common package. No exceptions.

## Architecture Overview

Discura is a platform for creating and managing Discord bots powered by LLMs. It has three main components:

- **Backend**: Node.js/Express with TSOA, serving the API
- **Frontend**: React + Material UI application
- **Common**: Shared types and utilities - the single source of truth for all shared code

### Common Package as Single Source of Truth

The common package is the central repository for all code, type definitions, and constants shared between the frontend and backend. This prevents mismatches and ensures a single source of truth.

1.  **Shared Types**: All type definitions (interfaces, enums, etc.) used by both frontend and backend are managed within the `common` package.
    *   **API Types** (for HTTP requests/responses) are defined in `common/src/types/api/`, marked with `@tsoaModel`, and then generated. They are imported from `common/schema/types` (in the backend) or `frontend/src/api/generated/` (in the frontend).
    *   **Non-API Shared Types** (for internal logic, shared utilities, etc.) are defined directly in `common/src/types/` (outside the `api` subfolder) and imported from `common/types`.
    *   (See the "Type System Flow - DEFINITIVE GUIDE" section for the exact workflow for defining and importing all shared types.)

2.  **Shared Constants**: Defined in `common/src/constants.ts` and imported from `common/constants`.

3.  **Shared Utilities**: Utility functions used by both frontend and backend are defined within the `common` package.

The generation pipeline (`./generate-api-types.sh`) is crucial for processing API types and making them available throughout the application. Always follow the specified workflows for defining and importing types.

### Route Handling Rules

- **Backend Routes**: No `/api` prefix (e.g., `/bots`, `/auth/profile`)
- **Frontend Requests**: Must use `/api` prefix (e.g., `/api/bots`)
- **Vite Proxy**: Configured to strip the `/api` prefix

### Type System Flow - DEFINITIVE GUIDE

There are TWO and ONLY TWO distinct types of shared types in Discura, each with its own specific workflow:

#### 1. API Types (Used in HTTP Requests/Responses)
API types MUST follow this EXACT workflow:
   - STEP 1: Define types in `common/src/types/api/` with `@tsoaModel` JSDoc tag
     ```typescript
     // EXAMPLE - common/src/types/api/llm.ts
     /**
      * LLM Model Data Structure
      * @tsoaModel
      */
     export interface LLMModelData {
       id: string;
       object: string;
       created: number;
       owned_by: string;
     }
     ```
   
   - STEP 2: Define controllers in `common/src/controllers/` that reference these types
     ```typescript
     // EXAMPLE - common/src/controllers/llm.controller.ts
     @Route(ROUTES.LLM)
     @Tags("LLM")
     export class LLMController extends Controller {
       @Get(ROUTES.LLM_ENDPOINTS.MODELS)
       @Security("jwt")
       public async getModels(): Promise<LLMModelsResponseDto> {
         // Controller methods in common define the API contract but not implementation
         throw new Error('Method not implemented in common package');
       }
     }
     ```
     
   - STEP 3: Run `./generate-api-types.sh` which will:
     - Create placeholder types with bootstrap-types.js (scanning common/src/types/api)
     - Generate swagger.json using TSOA (reading from common/src/controllers and common/src/types/api)
     - Convert swagger.json into TypeScript with sync-types.js
     - Output final types to common/src/schema/types.ts
     - Generate frontend client code
   
   - STEP 4: Import these types:
     - In backend code: `import { LLMModelData } from 'common/schema/types';`
     - In frontend code: `import { LLMModelData } from '../api/generated/api';`

   - CRITICAL: NEVER import API types directly from their definition files, ONLY from common/schema/types.ts

#### 2. Non-API Shared Types (Used Internally)
Non-API shared types MUST follow this EXACT workflow:
   - STEP 1: Define types DIRECTLY in common/src/types/ files (NOT in the /api subfolder)
     ```typescript
     // EXAMPLE - common/src/types/index.ts
     /**
      * Status of a Discord bot
      */
     export enum BotStatus {
       OFFLINE = 'OFFLINE',
       ONLINE = 'ONLINE', 
       ERROR = 'ERROR'
     }
     ```
   
   - STEP 2: Import these types from common/types in both frontend and backend:
     - In backend code: `import { BotStatus } from 'common/types';`
     - In frontend code: `import { BotStatus } from 'common/types';`

   - CRITICAL: NEVER define these types with @tsoaModel JSDoc tag or place them in common/src/types/api/

#### API Type Generation Process - STEP-BY-STEP (Updated May 2025)

The `./generate-api-types.sh` script performs these exact steps in the following order (order is critical):

1. **Bootstrap types** - Creates placeholder definitions in common/src/schema/types.ts
   - Uses bootstrap-types.js which scans common/src/types/api for @tsoaModel decorators
   - Creates temporary placeholder implementations of ALL API types
   - CRITICAL: This breaks circular dependencies by providing placeholder types that controllers can import from common/schema/types
   - This MUST run BEFORE any compilation of the common package

2. **Run TSOA in the common package** - Generates API schema using TSOA
   - Uses tsoa-bootstrap.js to run TSOA with correct working directory
   - Processes controllers in common/src/controllers/ that import from common/schema/types
   - Controllers MUST import types from '@discura/common/schema/types', NOT directly from their source files
   - Outputs swagger.json to common/src/schema/

3. **Synchronize types** - Converts swagger schema to TypeScript
   - Uses sync-types.js to read swagger.json 
   - Replaces the placeholder types in common/src/schema/types.ts with proper definitions

4. **Build common package** - Compiles TS to JS in common package
   - Uses the now properly generated types

5. **Generate frontend API** - Creates frontend API client
   - Generates TypeScript code in frontend/src/api/generated/

#### Clear Distinctions Between Type Workflows:

| Type Category | Definition Location | Decorator | Import In Backend | Import In Frontend |
|---------------|---------------------|-----------|-------------------|-------------------|
| API Types | common/src/types/api/* | @tsoaModel | @discura/common/schema/types | frontend/src/api/generated |
| Non-API Types | common/src/types/* | None | @discura/common/types | @discura/common/types |

#### ABSOLUTELY CRITICAL RULES:
- API types (request/response DTOs): DEFINE in `common/src/types/api` with `@tsoaModel` -> IMPORT from `common/schema/types` (backend) or `frontend/src/api/generated/` (frontend) (see table above for precise import paths).
- Non-API shared types (enums, interfaces): DEFINE directly in `common/src/types/` -> IMPORT from `common/types`
- NEVER duplicate types - each type has ONE definition location based on its category
- NEVER import API types directly from their definition files
- ALWAYS run `./generate-api-types.sh` after changing ANY API type

## Development Workflow

### Correct Process for API Changes

1. Define or modify API types in `common/src/types/api/` with `@tsoaModel` decorator
2. Update TSOA controllers with new routes referencing these types
3. Run `./generate-api-types.sh` (MANDATORY)
4. Use the generated types from the common package ONLY

### Type Definition Workflow

The proper type definition workflow varies based on the type of type:

#### For API Types (Request/Response Types):
1. Define types with `@tsoaModel` decorator in `common/src/types/api/` 
2. Generate using `./generate-api-types.sh`
3. ALWAYS import these types from common/schema/types.ts in backend code
4. ALWAYS import these types from frontend/src/api/generated/* in frontend code
5. NEVER import API types directly from their definition files

#### For Non-API Shared Types:
1. Define types DIRECTLY in common/src/types/ (not in the /api subfolder)
2. Import from common/types in both frontend and backend
3. NEVER define non-API shared types with the @tsoaModel decorator

### Debugging API Issues

- Check `tsoa.json` (`basePath` must be `""`)
- Verify route registration in `backend/build/routes.ts`
- Ensure frontend calls use `/api` prefix
- Verify Vite proxy configuration

## API & Type System

### API Contract Hierarchy

1. **Common Package API Types**: The source of truth for API type definitions (`common/src/types/api/`)
2. **TSOA Controllers**: The source of truth for API routes and endpoints
3. **tsoa.json**: Configuration for generation process
4. **Generation Script**: Transforms types and controllers into usable assets
5. **Generated Files**: Used by the application (never edit these)
6. **Import Sources**: Always import types from the generated files, never from source definitions

### Path Resolution for API Generation

The generate-api-types.sh script depends on correct path resolution to find API type definitions:

1. **Bootstrap Script**: `common/scripts/bootstrap-types.js` must correctly resolve API type paths
2. **Root Directory**: The script must use the correct rootDir value to find API types
   ```javascript
   // CORRECT path resolution in bootstrap-types.js:
   const rootDir = path.resolve(__dirname, '../..');
   const typesDir = path.join(rootDir, 'common/src/types/api');
   const typesGlob = path.join(typesDir, '**/*.ts');
   ```
3. **Type Discovery**: If API types aren't being found:
   - Check path resolution in bootstrap-types.js
   - Verify API type files exist in the expected location (`common/src/types/api/`)
   - Ensure the @tsoaModel decorator is properly applied to types

### Absolutely DO NOT

- ❌ Edit any generated files (`frontend/src/api/...`, `common/src/schema/...`)
- ❌ Hard-code API paths in frontend or backend code
- ❌ Define API types outside of `common/src/types/api/`
- ❌ Add leading slashes to TSOA `@Route` paths
- ❌ Import API types into frontend directly from `common`
- ❌ Import types directly between controllers (always use common as intermediary)
- ❌ Duplicate type definitions across frontend and backend
- ❌ Define shared logic or constants outside the common package
- ❌ Define non-API shared types with @tsoaModel decorator

## Common Patterns

### Database Access Pattern

1. Repositories: Raw database operations
2. Adapters: Data transformation
3. Services: Business logic
4. Controllers: HTTP interface

### Frontend Patterns

- Zustand for state management (one store per feature)
- Material UI component patterns
- Error boundaries and loading states

## Error Handling

- Repository Layer: Log & rethrow with context
- Adapter Layer: Transform to user-friendly errors
- Service Layer: Add retry logic and fallbacks
- Controller Layer: Map to HTTP status codes

## Module Resolution

### Common Package as Scoped Package

The "common" package is now implemented as a scoped package `@discura/common` for both frontend and backend:

1. **Import Pattern**: Use the scoped package name for imports:

   ```typescript
   // Correct
   import { Something } from "@discura/common/types";

   // Incorrect - don't use old style imports
   import { Something } from "common/types";
   ```

2. **Package Configuration**: The packages are configured as follows:

   ```json
   // backend/package.json and frontend/package.json
   "dependencies": {
     "@discura/common": "file:../common",
     // other dependencies...
   }
   ```

3. **Type Resolution**: TypeScript configurations are set up to properly resolve types:
   ```json
   // In tsconfig.json
   {
     "compilerOptions": {
       // Add paths to resolve the scoped package
       "paths": {
         "@discura/common": ["../common"],
         "@discura/common/*": ["../common/src/*", "../common/dist/*"]
       },
       // Add the common package's dist directory to typeRoots
       "typeRoots": ["./node_modules/@types", "../common/dist"],
       // Set up project references
       "composite": true
     },
     "references": [{ "path": "../common" }]
   }
   ```

### Shared Code Pattern

To ensure no mismatches between frontend and backend:

1. **Define Once**: Define all shared types, constants, and utility functions in the common package
2. **Import Once**: Import them exactly once from common into any other part of the codebase
3. **No Duplication**: Never duplicate any shared definitions across packages
4. **No Direct Imports Between Packages**: Never import from backend into frontend or vice versa
5. **Proper Flow**: Follow the "define in TSOA → generate to common → import from common" flow

### Module System Configuration

Our project uses different module systems for different packages:

1. **Backend & Common Packages**: Use CommonJS module system
   ```json
   {
     "compilerOptions": {
       "module": "CommonJS",
       "moduleResolution": "Node10"
     }
   }
   ```

2. **Frontend Package**: Uses ESM module system (for Vite compatibility)
   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "bundler"
     }
   }
   ```

### TypeScript Configuration Structure

The project uses a carefully structured TypeScript configuration approach:

1. **tsconfig.base.json**: Base configuration extended by all packages, containing shared settings.

2. **Main Package Configurations**: Each package has its primary `tsconfig.json` that extends the base:
   - `backend/tsconfig.json`: Main configuration for backend
   - `common/tsconfig.json`: Main configuration for common package
   - `frontend/tsconfig.json`: Main configuration for frontend

3. **Special-Purpose Configuration**:
   - `backend/tsconfig.routes.json`: Special configuration used exclusively for TSOA route compilation
     - This config is part of the API generation pipeline
     - It targets only the TSOA-generated routes file (`build/routes.ts`)
     - It's used specifically by the `build:tsoa` script
   - `frontend/tsconfig.app.json`: Application-specific config for React components
   - `frontend/tsconfig.node.json`: Node-specific config for Vite configuration

4. **Configuration Principles**:
   - Each configuration serves a distinct purpose in the build pipeline
   - Unnecessary duplication is avoided according to single-source-of-truth principles
   - Output directories are strictly separated from source directories

### JS File Emission

The project enforces strict separation of TypeScript source files and compiled JavaScript:

1. **Source Code**: All source code is written in TypeScript (`.ts`, `.tsx` files)

2. **Compiled Code**: JavaScript files should ONLY appear in designated output directories:
   - Backend: `backend/dist/`
   - Common: `common/dist/`
   - Frontend: `frontend/dist/`

3. **No Source Directory Emission**: JavaScript files should never appear alongside TypeScript files:
   ```
   // Correct structure
   src/
     feature.ts  // TypeScript source
   dist/
     feature.js  // Compiled JavaScript
     feature.d.ts  // Type declarations
   
   // Incorrect structure (DO NOT DO THIS)
   src/
     feature.ts  // TypeScript source
     feature.js  // ❌ Compiled JavaScript alongside source
   ```

4. **Development Environment Configuration**:
   - Backend development uses `ts-node` with proper flags to prevent file emission:
     ```
     ts-node --transpile-only --prefer-ts-exts --files --skip-project --emit=false
     ```
   - TSOA route generation is configured to output files only to the build directory
   - All TypeScript configurations enforce proper `outDir` paths

5. **TSOA Configuration**:
   The `tsoa.json` file includes specific compiler options to ensure route generation doesn't emit files in source directories:
   ```json
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
       "@/*": ["./src/*"],
       "common/*": ["../common/dist/*"]
     },
     "outDir": "./build"
   }
   ```

6. **Troubleshooting Unwanted JS Files**:
   If `.js` files appear in source directories:
   - Check `ts-node` flags in development scripts
   - Verify TSOA configuration has proper `outDir` setting
   - Confirm no watch processes are running with incorrect configuration
   - Run the clean script as a temporary measure: `npm run clean`

### Direct TypeScript File Usage

The project has been updated to work with `.ts` files directly without `.js` extensions in imports for better compatibility and maintainability:

1. **No .js Extensions in Imports**: Never use `.js` extensions when importing TypeScript files:
   ```typescript
   // Correct
   import { Something } from "./file";
   
   // Incorrect
   import { Something } from "./file.js";
   ```

2. **Declaration Generation Configuration**:
   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "declarationMap": true
     }
   }
   ```

3. **Proper Module Resolution**: Configured differently per package:
   - Backend/Common: Node10 resolution for CommonJS
   - Frontend: Bundler resolution for ESM

### Import Rules

1. **Backend & Common (CommonJS)**: Use the scoped package name without file extensions:
   ```typescript
   // Correct
   import { Something } from "@discura/common/types";
   
   // Incorrect
   import { Something } from "@discura/common/types.js";
   import { Something from "common/types";
   ```

2. **Frontend (ESM/Vite)**: Use the scoped package name and Vite's import resolution:
   ```typescript
   // Correct
   import { Something } from "@discura/common/types";
   import { Component } from "./Component";
   ```

3. **For Path Aliases**: Only the backend uses the @/* path alias for internal imports
   ```typescript
   // In backend:
   import { logger } from "@/utils/logger";
   ```

### Generated Files

When fixing import issues:

1. **DO NOT** directly edit generated files (e.g., `api.ts`) even if they contain import path errors
2. **DO** update the script templates that generate these files
3. **ALWAYS** run `./generate-api-types.sh` after fixing generator templates

### TSOA Configuration and Architecture

The project uses TSOA to generate API routes and documentation from TypeScript controllers and types. As of May 2025, the TSOA architecture follows these principles:

1. **Controllers in Common Package**: All TSOA controllers are defined in `common/src/controllers/` and consist of:
   - Route definitions with proper decorators (`@Route`, `@Get`, `@Post`, etc.)
   - Method signatures with proper return types
   - No implementation code - only placeholder implementations that throw "Method not implemented" errors

2. **Controller Implementation in Backend**: The backend package extends/implements these controller interfaces:
   - Imports the generated routes from `common/src/routes/routes`
   - Registers them with Express
   - Provides the actual implementation for each endpoint

3. **Authentication Module**:
   - Interface defined in `common/src/auth/authentication.ts` 
   - Implementation provided by `backend/src/middlewares/authentication.ts`
   - Referenced in `tsoa.json` via the `"authenticationModule"` setting

4. **TSOA Configuration**:
   - `common/tsoa.json` defines all TSOA settings
   - `"entryFile"` points to `./src/index.ts` within the common package
   - `"controllerPathGlobs"` targets `./src/controllers/**/*.ts` within common
   - Route generation outputs to `./src/routes` in common

5. **Working Directory**:
   - The `generate-api-types.sh` script ensures TSOA runs from the correct working directory
   - The `common/scripts/tsoa-bootstrap.js` script handles directory changes to ensure proper path resolution

This architecture ensures that the common package can be built independently without circular dependencies on backend code, following the "chicken and egg" avoidance principle mentioned in the project guidelines.

## API Type Troubleshooting

This section covers common issues encountered with API types and their solutions (updated May 2025).

### Circular Dependencies

When bootstrapping types and compiling the common package, circular dependencies can occur. Proper handling:

1. **Bootstrap Before Build**: The bootstrap-types.js script MUST run before building the common package
2. **Avoid Direct References**: Non-API shared types (e.g., Bot interface) should not directly reference API types like enums that haven't been generated yet
3. **Temporary String Types**: For interfaces in common/src/types that depend on API enums, use string type temporarily:
   ```typescript
   // Instead of this (creates circular dependency):
   interface Bot {
     status: BotStatus; // BotStatus defined in API types
   }
   
   // Use this approach:
   interface Bot {
     status: string; // Avoids circular dependency during bootstrap
   }
   ```

### TSOA Controller Import Issues

When implementing TSOA controllers, follow these SPECIFIC import patterns:

1. **Controller Base Class**: Import TSOA components directly from 'tsoa':
   ```typescript
   import { 
     Body,
     Controller,
     Get,
     Post,
     Route,
     Security,
     Tags
   } from 'tsoa';
   ```

2. **API Types**: Controllers MUST import API types from '@discura/common/schema/types':
   ```typescript
   import { 
     LLMModelData,
     LLMModelsResponseDto 
   } from '@discura/common/schema/types';
   ```
   
   CRITICAL: Controllers MUST NEVER import API types directly from their source definition files.
   ```typescript
   // INCORRECT - Will cause circular dependency during TSOA generation
   import { LLMModelData } from '@discura/common/src/types/api/llm';
   ```

3. **Non-API Shared Types**: Import non-API types from '@discura/common/types':
   ```typescript
   import { SomeUtilityType } from '@discura/common/types';
   ```

4. **Route Constants**: Import route constants from '@discura/common/types/routes':
   ```typescript
   import { ROUTES, CONTROLLER_ROUTES } from '@discura/common/types/routes';
   ```

5. **Import Express Request**: Use proper type for request parameters:
   ```typescript
   import { Request as ExpressRequest } from 'express';
   ```

This import pattern might initially appear circular (controllers import from schema/types which is generated from controllers), but:
1. The bootstrap-types.js script breaks this circular dependency by creating placeholder types
2. Controllers first use these placeholder types
3. After TSOA generation, the proper types replace the placeholders
4. This approach ensures a single source of truth

### Script Execution and Clean Build

The common package build process has specific requirements for successful type generation:

1. **Always Run generate-api-types.sh After Cleaning**: When running `npm run clean` in the common package, you MUST run `./generate-api-types.sh` from the root directory afterward to regenerate all necessary files.

2. **Prebuild Script**: The common package includes a prebuild script that checks if required generated directories exist and automatically runs the generation script if needed:
   ```json
   "prebuild": "if [ ! -d \"./src/schema\" ] || [ ! -d \"./src/routes\" ]; then cd .. && ./generate-api-types.sh; else node scripts/bootstrap-types.js; fi"
   ```

3. **Full Clean Build**: For a full clean build of the common package, use:
   ```bash
   npm run build:full
   ```
   This will clean all generated files and then run the complete API type generation pipeline.

4. **Missing Declaration Files**: If you encounter errors about missing declaration files (.d.ts), ensure:
   - The common package has been properly built with `npm run build`
   - The TypeScript compiler completed successfully without errors
   - The required directories (src/schema, src/routes) exist in the common package

### TSOA Decorator Detection

The bootstrap-types.js script scans for `@tsoaModel` decorators. Ensure proper formatting:

1. **JSDoc Format**: Use proper JSDoc comment format:
   ```typescript
   /**
    * Description of the type
    * @tsoaModel
    */
   export interface MyType {
     // properties
   }
   ```

2. **No Inline Decorators**: Do not use inline decorators or non-JSDoc comments:
   ```typescript
   // Incorrect - won't be detected
   // @tsoaModel
   export interface MyType {}
   ```

### Type Duplication Issues

Common duplication issues to avoid:

1. **Same Type in Multiple Files**: Never define the same type in both common/src/types/api/ and common/src/types/
2. **API vs Non-API Confusion**: API types (with @tsoaModel) belong in api/ folder, non-API types do not
3. **Enum Placement**: If an enum is used in API responses/requests, define it in common/src/types/api/ with @tsoaModel

## Project Status

### Current Tasks

1. **Path Alias Resolution** ✅ (Completed - May 2025)

   - Successfully converted from TypeScript path aliases to using the common package as a scoped package (@discura/common)
   - Updated TypeScript configurations to properly resolve declaration files
   - Fixed all import statements across the project to use the new scoped package format
   - Eliminated TypeScript errors related to module resolution

2. **TSOA Migration** ✅ (Completed - May 2025)

   - Successfully migrated TSOA controllers from backend to common package
   - Implemented proper architecture with controllers in common and implementations in backend
   - Added authentication interface in common with implementation in backend
   - Fixed path resolution issues in generate-api-types.sh script
   - Ensured common package can be built independently without backend dependencies

3. **Discord Integration** ⏳ (In Progress)

   - Working on fixing bot startup errors
   - Enhancing Discord client initialization and event handling
   - Implementing proper error reporting for Discord API issues

4. **Type Declaration Generation** ✅ (Completed - May 2025)

   - Fixed issues with declaration file generation in the common package
   - Updated build process to automatically check for required generated files
   - Implemented prebuild script to ensure API types are regenerated when needed
   - Added build:full script for complete clean builds of the common package

5. **API Type Generation Pipeline** ✅ (Completed - May 2025)
   - Fixed bootstrap process to properly detect @tsoaModel decorated types in JSDoc comments
   - Resolved circular dependencies in API type generation
   - Corrected build order to bootstrap types before compilation
   - Enhanced error handling in API type detection
   - Updated to use @discura/common scoped package name in all generated code

6. **Database Schema Alignment** ⏳ (In Progress)
   - Ensuring database schema matches API types
   - Implementing proper migrations and type safety

### Next Steps

1. Complete Discord Integration fixes
2. Finish bot configuration UI components
3. Enhance tool/function calling capabilities
4. Implement comprehensive testing
5. Add performance monitoring
6. Enhance error handling
7. Complete documentation

---

**REMEMBER:** The golden rule is to maintain a single source of truth. Define API types in `common/src/types/api/` with `@tsoaModel` decorator, run the generation script, and use the generated files.

**IMPORTANT:** ALL code that is shared between frontend and backend MUST be in the common package. This is not optional - it's the core architectural principle that prevents mismatches. Never duplicate or bypass the common package.

**Note**: NEVER encode hard coded paths, schema, etc. ABSOLUTELY NO hard-coded paths, schema, etc. should exist in files other than the generation files. EVERYTHING of such nature must be generated to keep ONLY and ONLY a single source of truth.

NEVER edit generated files (e.g., `frontend/src/api/generated/`, `frontend/src/api/schema.ts`, `common/src/schema/*`). ONLY edit the source of truth (`common/src/types/api/` for API types) so the changes will be reflected in the generated files after running `./generate-api-types.sh`.
