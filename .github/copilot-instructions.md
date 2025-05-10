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
- [Using Context7](#using-context7)
- [Troubleshooting Guide](#troubleshooting-guide)

## Core Mandates

> These rules are non-negotiable and must be followed without exception.

1.  **Single Source of Truth:** Define API types in `common/src/types/api/` with `@tsoaModel` JSDoc tag, and routes in TSOA controllers located in `common/src/controllers/`. Use route constants from `@discura/common/types/routes`.
2.  **Use Generation Pipeline:** ALWAYS run `./generate-api-types.sh` from the project root after changing API types or controllers.
3.  **NO Hard-Coding:** NEVER hard-code API paths or types. Use generated code and route constants.
4.  **NO Editing Generated Files:** NEVER edit files created by the generation script (e.g., in `common/src/schema/`, `common/src/routes/`, `frontend/src/api/generated/`, `frontend/src/api/schema.ts`).
5.  **Common Package Centralization:** ALL code shared between frontend and backend MUST be in the `@discura/common` package. No exceptions.

## Architecture Overview

Discura is a platform for creating and managing Discord bots powered by LLMs. It has three main components:

-   **Backend**: Node.js/Express with TSOA, serving the API. Implements controller logic defined in the common package.
-   **Frontend**: React + Material UI application. Consumes the API.
-   **Common (`@discura/common`)**: Shared types, constants, TSOA controller definitions, and utilities. This is the single source of truth for all shared code.

### Common Package as Single Source of Truth

The `@discura/common` package is the central repository for all code, type definitions, and constants shared between the frontend and backend. This prevents mismatches and ensures a single source of truth.

1.  **Shared Types**: All type definitions (interfaces, enums, etc.) used by both frontend and backend are managed within the `@discura/common` package.
    *   **API Types** (for HTTP requests/responses) are defined in `common/src/types/api/`, marked with `@tsoaModel`, and then generated.
        *   Backend imports from `@discura/common/schema/types`.
        *   Frontend imports from `frontend/src/api/generated/` (which are generated from the common package's schema).
    *   **Non-API Shared Types** (for internal logic, shared utilities, etc.) are defined directly in `common/src/types/` (outside the `api` subfolder).
        *   Both backend and frontend import these from `@discura/common/types`.
    *   (See the "Type System Flow - DEFINITIVE GUIDE" section for the exact workflow.)

2.  **Shared Constants**: Defined in `common/src/constants.ts` and imported from `@discura/common/constants`.

3.  **TSOA Controller Definitions**: Defined in `common/src/controllers/`. These define the API contract (routes, request/response shapes) but contain only placeholder implementations.

4.  **Shared Utilities**: Utility functions used by both frontend and backend are defined within the `@discura/common` package.

The generation pipeline (`./generate-api-types.sh`) is crucial for processing API types and TSOA controllers, making them available throughout the application. Always follow the specified workflows.

### Route Handling Rules

-   **Backend Routes (Actual API Endpoints)**: No `/api` prefix (e.g., `/bots`, `/auth/profile`). These are defined by TSOA controllers in `@discura/common` and implemented in the backend.
-   **Frontend API Requests**: Must use `/api` prefix when making HTTP calls (e.g., `axios.get('/api/bots')`).
-   **Vite Proxy**: Configured in `frontend/vite.config.ts` to proxy requests from `/api` to the backend (e.g., `http://localhost:3001`), stripping the `/api` prefix.

### Type System Flow - DEFINITIVE GUIDE

There are TWO and ONLY TWO distinct types of shared types in Discura, each with its own specific workflow:

#### 1. API Types (Used in HTTP Requests/Responses)
API types MUST follow this EXACT workflow:
   - STEP 1: Define types in `common/src/types/api/` with `@tsoaModel` JSDoc tag.
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
   
   - STEP 2: Define/update TSOA controllers in `common/src/controllers/` that reference these API types. Controllers import API types from `../types`.
     ```typescript
     // EXAMPLE - common/src/controllers/llm.controller.ts
     import { Controller, Get, Route, Security, Tags } from 'tsoa';
     import { LLMModelsResponseDto } from '../types'; // Current implementation
     import { CONTROLLER_ROUTES } from '../types/routes;

     @Route(CONTROLLER_ROUTES.LLM)
     @Tags("LLM")
     export class LLMController extends Controller {
       @Get('models')
       @Security("jwt")
       public async getModels(): Promise<LLMModelsResponseDto> {
         // Controller methods in common define the API contract but not implementation
         throw new Error('Method not implemented in common package');
       }
     }
     ```
     
   - STEP 3: Run `./generate-api-types.sh` from the project root. This script will:
     - Execute `common/scripts/bootstrap-types.js` to scan `common/src/types/api` for `@tsoaModel` types and create:
       - Initial placeholder definitions in `common/src/schema/types.ts`
       - An index file in `common/src/types/api` that re-exports all API types to help TSOA find them
     - Execute `common/scripts/tsoa-bootstrap.js` which:
       - Creates temporary helper files for type resolution
       - Updates the TSOA configuration if necessary
       - Runs TSOA (using `common/tsoa.json`) to generate `common/src/schema/swagger.json` (OpenAPI specification)
     - Execute `common/scripts/sync-types.js` to read `common/src/schema/swagger.json` and generate the final, complete type definitions in `common/src/schema/types.ts`, replacing the placeholders
     - Run TSOA again to generate `common/src/routes/routes.ts` (TSOA-generated Express routes)
     - Build the `@discura/common` package
     - Generate the frontend API client code in `frontend/src/api/generated/` and the schema in `frontend/src/api/schema.ts` based on `common/src/schema/swagger.json`
   
   - STEP 4: Import these API types:
     - In backend code (e.g., service implementations): `import { LLMModelData } from '@discura/common/schema/types';`
     - In frontend code: `import { LLMModelData } from 'src/api';` (this path assumes `baseUrl: "src"` in `frontend/tsconfig.json` or a similar setup; adjust to `../api` or an alias like `@/api` as per your project's specific path resolution from `frontend/src/api/index.ts` which should re-export all necessary types and client parts from `frontend/src/api/generated/`).

   - CRITICAL: NEVER import API types directly from their original definition files (e.g., `common/src/types/api/llm.ts`) into application logic. ALWAYS use the generated paths. Controllers within the common package should import from '../types', while frontend components should import API types and client functionalities *only* through the `frontend/src/api/index.ts` facade.

#### 2. Non-API Shared Types (Used Internally for logic, constants, enums not part of HTTP bodies)
Non-API shared types MUST follow this EXACT workflow:
   - STEP 1: Define types DIRECTLY in `common/src/types/` files (e.g., `common/src/types/index.ts`, `common/src/types/auth.ts`). DO NOT place them in the `common/src/types/api/` subfolder. DO NOT use `@tsoaModel`.
     ```typescript
     // EXAMPLE - common/src/types/index.ts
     /**
      * Status of a Discord bot (Non-API, used internally)
      */
     export enum BotStatus {
       OFFLINE = 'OFFLINE',
       ONLINE = 'ONLINE', 
       ERROR = 'ERROR'
     }

     export interface MyInternalConfig {
        setting: string;
     }
     ```
   
   - STEP 2: Import these types directly from `@discura/common/types` in both frontend and backend code.
     - In backend code: `import { BotStatus, MyInternalConfig } from '@discura/common/types';`
     - In frontend code: `import { BotStatus, MyInternalConfig } from '@discura/common/types';` (or adjust path based on Vite aliases if set up, e.g. `import { BotStatus } from '@/common/types';` if an alias `@/common` points to `../common/src`)

   - CRITICAL: NEVER define these types with `@tsoaModel` JSDoc tag or place them in `common/src/types/api/`.

#### API Type Generation Process - STEP-BY-STEP (Updated May 2025)

The `./generate-api-types.sh` script performs these exact steps in the following order (order is critical):

1.  **Bootstrap types**: Creates placeholder definitions in `common/src/schema/types.ts`.
    *   Uses `common/scripts/bootstrap-types.js` which scans `common/src/types/api` for `@tsoaModel` decorators.
    *   Creates temporary placeholder implementations of ALL API types.
    *   CRITICAL: This breaks circular dependencies by providing placeholder types that controllers in `common/src/controllers` can import from `@discura/common/schema/types`.
    *   This MUST run BEFORE TSOA attempts to generate routes from controllers.

2.  **Run TSOA in the common package**: Generates API schema and routes.
    *   Uses `common/scripts/tsoa-bootstrap.js` to run TSOA with the correct working directory (`common`).
    *   TSOA (configured by `common/tsoa.json`) processes controllers in `common/src/controllers/`. These controllers import API types from `@discura/common/schema/types` (which are placeholders at this stage).
    *   Outputs `swagger.json` to `common/src/schema/`.
    *   Outputs `routes.ts` to `common/src/routes/`.

3.  **Synchronize types**: Converts swagger schema to final TypeScript definitions.
    *   Uses `common/scripts/sync-types.js` to read `common/src/schema/swagger.json`.
    *   Replaces the placeholder types in `common/src/schema/types.ts` with proper, complete definitions derived from the OpenAPI schema.

4.  **Build common package**: Compiles TS to JS in the `@discura/common` package.
    *   Uses the now properly generated and finalized types in `common/src/schema/types.ts`.

5.  **Generate frontend API client**: Creates a typed API client for the frontend.
    *   Uses tools like `openapi-typescript` and `openapi-typescript-codegen` (as per `frontend/package.json`).
    *   Reads `common/src/schema/swagger.json`.
    *   Generates TypeScript code in `frontend/src/api/generated/`.

#### Clear Distinctions Between Type Workflows:

| Type Category        | Definition Location        | Decorator   | Import In Backend                     | Import In Frontend                      |
| -------------------- | -------------------------- | ----------- | ------------------------------------- | --------------------------------------- |
| API Types            | `common/src/types/api/*`   | `@tsoaModel` | `@discura/common/schema/types`        | `src/api` (via `frontend/src/api/index.ts`) |
| Non-API Shared Types | `common/src/types/*`       | None        | `@discura/common/types`               | `@discura/common/types`                 |

#### ABSOLUTELY CRITICAL RULES:
-   API types (request/response DTOs): DEFINE in `common/src/types/api` with `@tsoaModel` -> IMPORT from `@discura/common/schema/types` (backend) or `src/api` (frontend, via `frontend/src/api/index.ts`).
-   Non-API shared types (enums, internal interfaces): DEFINE directly in `common/src/types/` (NOT in `api/` subfolder) -> IMPORT from `@discura/common/types`.
-   NEVER duplicate types - each type has ONE definition location based on its category.
-   NEVER import API types directly from their source definition files (e.g., `common/src/types/api/user.ts`) in controllers or application logic.
-   ALWAYS run `./generate-api-types.sh` after changing ANY API type or TSOA controller definition.

## Development Workflow

### Correct Process for API Changes

1.  Define or modify API types in `common/src/types/api/` with the `@tsoaModel` decorator.
2.  Update TSOA controllers in `common/src/controllers/` with new/modified routes referencing these API types (importing them from `../types`).
3.  Run `./generate-api-types.sh` from the project root (MANDATORY).
4.  Implement the actual controller logic in the backend package, extending or using the TSOA-generated routes and common controller definitions.
5.  Use the generated types/API client in the frontend and backend as per the "Type System Flow".

### Type Definition Workflow

The proper type definition workflow varies based on the type of type:

#### For API Types (Request/Response Types):
1.  Define types with `@tsoaModel` decorator in `common/src/types/api/`.
2.  Generate using `./generate-api-types.sh`.
3.  In TSOA controllers within `common/src/controllers/`, import API types from `../types`.
4.  In backend service implementations, import API types from `@discura/common/schema/types`.
5.  In frontend code, import API types from `src/api` (or `../api` depending on the file location, leveraging `frontend/src/api/index.ts` which re-exports from `./generated`).
6.  NEVER import API types directly from their original definition files (e.g., `common/src/types/api/mytype.ts`) in application logic.

#### For Non-API Shared Types:
1.  Define types DIRECTLY in `common/src/types/` (not in the `/api` subfolder).
2.  Import from `@discura/common/types` in both frontend and backend.
3.  NEVER define non-API shared types with the `@tsoaModel` decorator.

### Debugging API Issues

-   Check `common/tsoa.json` (ensure `basePath` is `""` or correctly set if needed, `entryFile`, `controllerPathGlobs`, and `modelsPathGlobs` are correct).
-   Check for debug information in temporary files if `DEBUG_MODE = true` is set in `common/scripts/tsoa-bootstrap.js`.
-   Verify route registration in the backend (e.g., how `RegisterRoutes` from `common/src/routes/routes.ts` is used).
-   Ensure frontend API calls use the `/api` prefix.
-   Verify Vite proxy configuration in `frontend/vite.config.ts`.
-   Inspect `common/src/schema/swagger.json` to see what TSOA generated.

## API & Type System

### API Contract Hierarchy

1.  **Common Package API Types**: The source of truth for API type definitions (`common/src/types/api/`).
2.  **TSOA Controllers (in Common)**: The source of truth for API routes and endpoint signatures (`common/src/controllers/`).
3.  **`common/tsoa.json`**: Configuration for the TSOA generation process.
4.  **`./generate-api-types.sh`**: The script that orchestrates the transformation of types and controllers into usable assets.
5.  **Generated Files**:
    *   `common/src/schema/types.ts` (final API types for backend/common)
    *   `common/src/schema/swagger.json` (OpenAPI spec)
    *   `common/src/routes/routes.ts` (TSOA-generated Express routes)
    *   `frontend/src/api/generated/*` (frontend API client)
    These are used by the application; NEVER edit these directly.
6.  **Import Sources**: Always import types and API clients from the generated files, never from original source definitions for API types.

### Path Resolution for API Generation

The `generate-api-types.sh` script requires exact path resolution:

1.  **Bootstrap Script (`common/scripts/bootstrap-types.js`)**: Resolves paths to `common/src/types/api` using this exact pattern:
    ```javascript
    // Path resolution in bootstrap-types.js:
    const rootDir = path.resolve(__dirname, '..', '..'); // Resolves to project root from common/scripts
    const typesApiDir = path.join(rootDir, 'common', 'src', 'types', 'api');
    const typesGlob = path.join(typesApiDir, '**/*.ts');
    ```
2.  **TSOA Configuration (`common/tsoa.json`)**: All paths must be specified relative to the `common` package root:
    ```json
    {
      "entryFile": "./src/index.ts",
      "controllerPathGlobs": ["./src/controllers/**/*.ts"],
      "routes": {
        "routesDir": "./src/routes"
      },
      "spec": {
        "outputDirectory": "./src/schema"
      },
      "modelsPathGlobs": ["./src/types/api/**/*.ts"]
    }
    ```
3.  **When API Types Are Not Found During Generation**:
    *   Verify path resolution in `bootstrap-types.js` matches the example above
    *   Confirm API type files exist in `common/src/types/api/` folder
    *   Ensure the `@tsoaModel` decorator is correctly formatted in JSDoc comments (see TSOA Decorator Detection section)
    *   Verify controllers in `common/src/controllers` import API types from `../types`
    *   Set `DEBUG_MODE = true` in `common/scripts/tsoa-bootstrap.js` and check the temporary files created

### Absolutely DO NOT

-   ❌ Edit any generated files (e.g., `frontend/src/api/generated/*`, `frontend/src/api/schema.ts`, `common/src/schema/*`, `common/src/routes/routes.ts`).
-   ❌ Hard-code API paths in frontend or backend code; use generated clients or route constants.
-   ❌ Define API types outside of `common/src/types/api/`.
-   ❌ Add leading slashes to TSOA `@Route` paths (e.g., use `@Route("bots")` not `@Route("/bots")`).
-   ❌ Import API types into the frontend directly from `@discura/common/schema/types` or `@discura/common/src/types/api/*`. Use the generated frontend client, accessed via `src/api` (or `../api`, from `frontend/src/api/index.ts`). Avoid direct imports from `frontend/src/api/generated/**` in application code (pages, components); use the `frontend/src/api/index.ts` facade.
-   ❌ Import types directly between controllers if they are API types; use `@discura/common/schema/types`.
-   ❌ Duplicate type definitions across frontend, backend, or within common.
-   ❌ Define shared logic or constants outside the `@discura/common` package.
-   ❌ Define non-API shared types with the `@tsoaModel` decorator or place them in `common/src/types/api/`.

### Frontend Import Patterns for API Types

When importing API types in frontend code:

1. **ALWAYS** import from the API facade:
   ```typescript
   // Correct import pattern for frontend components and pages
   import { BotResponseDto, CreateBotRequest } from 'src/api'; 
   // OR (depending on file location relative to src/api/index.ts)
   import { BotResponseDto, CreateBotRequest } from '../api';
   ```

2. **NEVER** import directly from generated files:
   ```typescript
   // INCORRECT - DO NOT DO THIS
   import { BotResponseDto } from 'src/api/generated/models/BotResponseDto';
   import { CreateBotRequest } from 'src/api/generated/models/CreateBotRequest';
   ```

3. **NEVER** import API types from common directly in frontend code:
   ```typescript
   // INCORRECT - DO NOT DO THIS
   import { BotResponseDto } from '@discura/common/schema/types';
   import { CreateBotRequest } from '@discura/common/src/types/api/bot';
   ```

The `frontend/src/api/index.ts` file MUST re-export all needed API types and services from the generated code:

```typescript
// Example of correct frontend/src/api/index.ts facade
export * from './generated/models/BotResponseDto';
export * from './generated/models/CreateBotRequest';
export * from './generated/services/BotService';
// ...other exports
```

### Frontend API Integration Patterns

When implementing frontend API integration, follow these exact patterns:

1. **API Client Usage**:
   ```typescript
   // In a React component or store
   import { BotsService, BotResponseDto } from 'src/api';
   
   // Fetch bots
   const fetchBots = async () => {
     try {
       const response = await BotsService.getUserBots();
       return response.bots;
     } catch (error) {
       // Handle error appropriately
       console.error('Failed to fetch bots:', error);
       throw error;
     }
   };
   ```

2. **Error Handling**:
   ```typescript
   import { ErrorResponseDto } from 'src/api';
   
   try {
     await BotsService.createBot(newBot);
   } catch (error) {
     // The generated client provides typed error responses
     if (error.status === 400) {
       const errorData = error.body as ErrorResponseDto;
       // Handle validation errors
       setErrors(errorData.errors || {});
     } else if (error.status === 401) {
       // Handle unauthorized
       authStore.redirectToLogin();
     } else {
       // Handle unexpected errors
       showErrorToast('An unexpected error occurred');
     }
   }
   ```

3. **Request Cancellation**:
   ```typescript
   import { CancelablePromise } from 'src/api';
   
   // Store the promise to allow cancellation
   let currentRequest: CancelablePromise<any> | null = null;
   
   const fetchData = () => {
     // Cancel previous request if it exists
     if (currentRequest) {
       currentRequest.cancel();
     }
     
     // Create new request
     currentRequest = ApiService.getData();
     
     currentRequest
       .then(response => {
         setData(response);
       })
       .catch(error => {
         if (error.isCancelled) {
           // Request was cancelled, no need to handle
           return;
         }
         // Handle actual errors
         setError(error);
       })
       .finally(() => {
         currentRequest = null;
       });
   };
   
   // Always cancel pending requests on component unmount
   useEffect(() => {
     return () => {
       if (currentRequest) {
         currentRequest.cancel();
       }
     };
   }, []);
   ```

4. **File Upload**:
   ```typescript
   const uploadFile = async (file: File) => {
     const formData = new FormData();
     formData.append('file', file);
     
     // Use the generated API client for uploads
     return await UploadService.uploadFile({
       formData
     });
   };
   ```

These patterns leverage the type safety of the generated API client while maintaining clean, consistent code structure throughout the application.

## Common Patterns

### Database Access Pattern (Backend)

1.  **Models (Sequelize)**: Define database schema and interactions (e.g., `backend/src/models/bot.model.ts`).
2.  **Repositories (Optional)**: Abstract raw database operations if logic becomes complex.
3.  **Services**: Contain business logic, use models (or repositories) for data access (e.g., `backend/src/services/bot.service.ts`).
4.  **Controller Implementations (Backend)**: Implement the TSOA controller interfaces defined in `@discura/common`. Use services for business logic. Connect HTTP layer to services.

### Frontend Patterns

-   **Zustand**: For global state management (e.g., `frontend/src/stores/authStore.ts`). Aim for one store per logical feature.
-   **Material UI**: For UI components.
-   **Generated API Client**: For all backend communication (`frontend/src/api/index.ts` often wraps the generated services).
-   **Error Boundaries & Loading States**: Standard React patterns for robust UI.

## Error Handling

-   **Backend Services**: Throw specific, custom errors or use a standard error DTO.
-   **Backend Controllers**: Catch service errors and map them to appropriate HTTP status codes and response DTOs (e.g., `ErrorResponseDto` from `@discura/common/schema/types`).
-   **Frontend**: Handle API errors from the generated client, update UI accordingly (e.g., show toasts, error messages).

### Module Resolution Specifics

The exact configuration for resolving `@discura/common` package in both frontend and backend:

1. **Project References Configuration**:
   ```json
   // In common/tsconfig.json
   {
     "compilerOptions": {
       "composite": true,
       // other options...
     }
   }

   // In backend/tsconfig.json and frontend/tsconfig.json
   {
     "references": [
       { "path": "../common" }
     ]
   }
   ```

2. **Path Mapping Configuration**:
   ```json
   // In backend/tsconfig.json and frontend/tsconfig.json
   "compilerOptions": {
     "baseUrl": "src",
     "paths": {
       "@discura/common": ["../../common/src"],
       "@discura/common/*": ["../../common/src/*"] 
     }
   }
   ```

3. **Package Dependency Configuration**:
   ```json
   // In backend/package.json and frontend/package.json
   "dependencies": {
     "@discura/common": "file:../common"
   }
   ```

These configurations MUST be maintained exactly as shown to ensure proper module resolution throughout the project.

### Shared Code Pattern

1.  **Define Once**: All shared code (types, constants, utilities, TSOA controller definitions) in `@discura/common`.
2.  **Import Correctly**: Use the scoped package name for imports.
    ```typescript
    // Correct
    import { MyApiType } from "@discura/common/schema/types";
    import { MySharedUtil } from "@discura/common/utils"; // Assuming utils are exported
    import { MyNonApiType } from "@discura/common/types";

    // Incorrect (old style or direct relative paths across packages)
    // import { Something } from "common/types";
    // import { Something } from "../common/src/types";
    ```

3.  **No Duplication**: Critical.
4.  **No Direct Cross-Package Imports**: Apart from importing `@discura/common`.

### Module System Configuration

1.  **Backend & Common Packages**: Use CommonJS.
    ```json
    // common/tsconfig.json and backend/tsconfig.json
    {
      "compilerOptions": {
        "module": "CommonJS",
        "moduleResolution": "Node10" // Or "NodeNext" for modern Node.js with CommonJS
      }
    }
    ```

2.  **Frontend Package**: Uses ESM (for Vite compatibility).
    ```json
    // frontend/tsconfig.json
    {
      "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "bundler" // Recommended for Vite/modern bundlers
      }
    }
    ```

### TypeScript Configuration Structure

1.  **`tsconfig.base.json` (Root)**: Contains common compiler options inherited by all packages.
2.  **Main Package Configurations**:
    *   `common/tsconfig.json`: Extends base, requires `composite: true`, contains specific settings for common lib.
    *   `backend/tsconfig.json`: Extends base, references `common`.
    *   `frontend/tsconfig.json`: Extends base, references `common`, includes ESM specific settings.
3.  **Special-Purpose Configurations**:
    *   `common/tsconfig.tsoa.json`: Used specifically by TSOA during generation, configured within `common/tsoa.json`. Contains overrides for TSOA's type resolution, including paths to ensure it can resolve types from `@discura/common/schema/types` during generation.
    *   `frontend/tsconfig.node.json`: Used exclusively for the Vite config file (`vite.config.ts`), configured with `module: CommonJS`.
    *   `frontend/tsconfig.app.json`: Used by Vite for the application code, mostly identical to `frontend/tsconfig.json` but with specific configuration for the React application.

### JS File Emission

1.  **Source Code**: TypeScript (`.ts`, `.tsx`).
2.  **Compiled Code Output Directories**:
    *   Backend: `backend/dist/`
    *   Common: `common/dist/`
    *   Frontend: `frontend/dist/` (Vite's build output)
3.  **No Source Directory Emission**: Crucial. `outDir` must be set correctly in all `tsconfig.json` files.
4.  **Development Environment**:
    *   Backend: `ts-node` with `--transpile-only` for speed.
    *   Frontend: Vite handles TS compilation in memory.
5.  **TSOA Configuration (`common/tsoa.json`)**:
    *   The `compilerOptions` within `tsoa.json` can influence how TSOA interprets TypeScript files but doesn't directly control final build output. TSOA generates `.ts` files (`routes.ts`) into `common/src/routes/`, which are then compiled by the main `common/tsconfig.json` build process into `common/dist/routes/`.

### Direct TypeScript File Usage & Import Rules

1.  **No `.js` Extensions in Imports**: Always import by module name or path without extension.
    ```typescript
    import { Something } from "./file"; // Not "./file.js"
    import { Another } from "@discura/common/types"; // Not ".../types.js"
    ```
2.  **Declaration Files (`.d.ts`)**: `declaration: true` and `declarationMap: true` should be enabled in `common/tsconfig.json` and potentially `backend/tsconfig.json` if it's intended to be a library.
3.  **Import Paths**:
    *   Backend & Common: `@discura/common/schema/types`, `@discura/common/types`, `@discura/common/constants`, etc.
    *   Frontend: `@discura/common/types`, `@discura/common/constants`. For API types, use the generated client via the facade: `import { MyModel } from 'src/api';` (or `../api` depending on the file location).
    *   Backend internal aliases (e.g., `@/utils/logger` in `backend/src`): Configured in `backend/tsconfig.json` paths.

### Generated Files - Import Path Issues

1.  **DO NOT** directly edit generated files (e.g., `frontend/src/api/generated/index.ts` or `common/src/routes/routes.ts`).
2.  **DO** update the configuration of the tools that generate these files (e.g., `openapi-typescript-codegen` config for frontend, `tsoa.json` for common routes/schema) or the templates they use, if applicable.
3.  **ALWAYS** run `./generate-api-types.sh` after fixing generator configurations/templates.

### TSOA Configuration and Architecture (Updated May 2025)

1.  **Controllers in Common Package**: `common/src/controllers/` define API contracts.
    *   Use TSOA decorators (`@Route`, `@Get`, `@Post`, `@Security`, `@Tags`, `@Request`, `@Body`, `@Path`, `@Query`, `@Header`).
    *   Import API types from `../types` (the current implementation).
    *   Import `Request as ExpressRequest` from `express` for `@Request()` decorator.
    *   Placeholder implementations: `throw new Error('Method not implemented in common package');`

2.  **Controller Implementation in Backend**: Backend services implement the logic. Backend Express app uses `RegisterRoutes` from `common/dist/routes/routes.js` (after compilation) and provides actual handlers that map to these services.

3.  **Authentication Module**:
    *   Interface/logic defined in `common/src/auth/authentication.ts`.
    *   Implementation provided by `backend/src/middlewares/authentication.ts`.
    *   Referenced in `common/tsoa.json` via `"authenticationModule": "./src/auth/authentication.ts"`. TSOA will call the `authenticate` function from this module.

4.  **TSOA Configuration (`common/tsoa.json`)**:
    *   `"entryFile": "./src/index.ts"` (or a more minimal entry if `src/index.ts` is too broad).
    *   `"controllerPathGlobs": ["./src/controllers/**/*.ts"]`.
    *   `"routes.routesDir": "./src/routes"` (TSOA generates `routes.ts` here).
    *   `"spec.outputDirectory": "./src/schema"` (TSOA generates `swagger.json` here).
    *   `"modelsPathGlobs": ["./src/types/api/**/*.ts"]` (helps TSOA find all types with `@tsoaModel`).
    *   `"jsdoc": { "enabled": true }` (ensures TSOA correctly processes JSDoc decorators).

5.  **Debug Features**: `common/scripts/tsoa-bootstrap.js` includes debug features (controlled by a DEBUG_MODE flag) that create temporary files for troubleshooting TSOA issues. These include:
    *   Creating a direct reference file that re-exports all API types
    *   Creating a debug types file that contains all API type definitions
    *   Patching controller imports temporarily during generation

6.  **Working Directory**: `generate-api-types.sh` ensures TSOA runs via `common/scripts/tsoa-bootstrap.js`, which sets the working directory to `common/`.

7.  **Route Path Patterns**: 
    *   Class-level routes use route constants: `@Route(CONTROLLER_ROUTES.BOTS)` 
    *   Individual endpoints can use either:
        *   Constants for complex paths: `@Get(ROUTES.SOME_ENDPOINT)`
        *   Simple strings for basic paths: `@Get('/')`, `@Get('{id}')`
    *   Never use leading slashes in paths (e.g., use `@Get('users')` not `@Get('/users')`)

## API Type Troubleshooting

### Circular Dependencies

1.  **Bootstrap Before TSOA**: `bootstrap-types.js` creates placeholders in `common/src/schema/types.ts` and MUST run before TSOA generates routes. This is handled automatically by `generate-api-types.sh`.

2.  **Controller Import Pattern**: Controllers in `common/src/controllers/` currently import API types from `../types`, not from `@discura/common/schema/types` as originally instructed. The `tsoa-bootstrap.js` script handles this by temporarily patching imports during generation to allow TSOA to properly resolve types.

3.  **Temporary Helper Files**: During generation, several temporary files are created to assist with type resolution:
    * A direct reference file in `common/src/types/api/tsoa-reference.ts` that re-exports all API types
    * Debug type files in a temporary directory if `DEBUG_MODE = true` is set
    * Backup copies of controllers before patching imports

4.  **Non-API Type Dependencies**: If a Non-API shared type (defined in `common/src/types/`, not `common/src/types/api/`) needs to reference a type that originates from an API definition (defined in `common/src/types/api/`), the Non-API type should import it from the generated path (`@discura/common/schema/types`) after the generation process.
    ```typescript
    // common/src/types/index.ts
    // Example of a Non-API shared type
    import { ApiSpecificStatus } from '@discura/common/schema/types';
    
    export interface MyInternalDataObject { 
      id: string;
      name: string;
      status: ApiSpecificStatus; // Imported from generated schema/types
    }
    ```
    
5.  **Debugging Generation Issues**: If you encounter circular dependency issues:
    * Set `DEBUG_MODE = true` in `common/scripts/tsoa-bootstrap.js` to preserve temporary files
    * Check the temporary files in `common/src/temp/debug/` to see which types are being found
    * Verify that `common/src/types/api/index.ts` correctly re-exports all API types
    * Ensure controllers in `common/src/controllers/` import API types from `../types`

### TSOA Controller Import Issues

The exact import pattern requirements for `common/src/controllers/*.ts` files are:

1.  **TSOA Components**: `import { Body, Controller, Get, ... } from 'tsoa';`
2.  **API Types**: `import { UserResponseDto, CreateBotRequest } from '../types';` (Required current implementation)
3.  **Non-API Shared Types**: `import { SomeInternalEnum } from '../types';`
4.  **Route Constants**: `import { CONTROLLER_ROUTES, ROUTES } from '../types/routes';`
5.  **Express Request**: `import { Request as ExpressRequest } from 'express';` (For `@Request()` decorator)

The `tsoa-bootstrap.js` script temporarily patches these imports during generation to ensure proper type resolution. Do not modify this pattern as it will break the API generation process.

### Script Execution and Clean Build

1.  **`./generate-api-types.sh`**: ALWAYS run from project root after ANY changes to `common/src/types/api/` or `common/src/controllers/`.
2.  **`common` prebuild script**: `common/package.json` includes a `prebuild` script that runs `generate-api-types.sh` if `src/schema` or `src/routes` directories are missing.
3.  **Full Clean Build Process**:
    ```bash
    npm run clean # In root, or per package
    npm run install # In root, to relink @discura/common
    ./generate-api-types.sh
    npm run build # In root (or common, then backend, then frontend)
    ```
    The `common` package has a `npm run build:full` command that executes `npm run clean && cd .. && ./generate-api-types.sh && npm run build`.

4.  **Resolving Missing Declaration Files (`.d.ts`) for `@discura/common`**:
    *   First, ensure `@discura/common` built successfully with `npm run build -w @discura/common` or via root build.
    *   Verify that `.d.ts` files exist in `common/dist`.
    *   Confirm that `frontend/tsconfig.json` and `backend/tsconfig.json` correctly reference `common` through `paths` and `references`.
    *   Ensure the declaration files `auth.d.ts`, `routes.d.ts`, `schema.d.ts` exist in `backend/src/types` and `frontend/src/types` (or `frontend/src/shims-*.d.ts`).

### TSOA Decorator Detection

For API types to be properly detected during generation:

1. **Required JSDoc Format**: The `@tsoaModel` tag MUST:
   ```typescript
   /**
    * Description of your model (optional)
    * @tsoaModel
    */
   export interface MyApiModel {
     // properties here
   }
   ```

2. **Common Detection Issues**:
   - Tag must be within a JSDoc comment block (with `/**` and `*/`)
   - Single-line comments `//` are NOT detected
   - The tag must be exact: `@tsoaModel` (no spaces, lowercase "tsoa", uppercase "M")
   - Export must be directly after the JSDoc block with no lines in between

3. **Testing Detection**:
   To verify your type is being detected properly:
   ```bash
   # Enable debug mode for type detection
   sed -i '' 's/const DEBUG_MODE = false;/const DEBUG_MODE = true;/' common/scripts/tsoa-bootstrap.js
   
   # Run generation
   ./generate-api-types.sh
   
   # Check debug files
   ls -la common/src/temp/debug/
   cat common/src/temp/debug/tsoa-reference.ts
   ```

### Implicit Type Library Errors (TS2688 for 'auth', 'routes', 'schema')

These errors (e.g., "Cannot find type definition file for 'auth'") occur if TypeScript tries to interpret 'auth', 'routes', or 'schema' as global type libraries due to certain import patterns or `typeRoots` configurations.
**Solution**:
1.  **Explicit Declaration Files**: Create `auth.d.ts`, `routes.d.ts`, `schema.d.ts` in a directory included in `typeRoots` (e.g., `backend/src/types/`, `frontend/src/types/` or a dedicated `frontend/src/shims/` dir).
    ```typescript
    // Example: backend/src/types/auth.d.ts
    /**
     * Reference declaration file to help TypeScript resolve 'auth' module paths
     * if they are being treated as implicit type libraries.
     * This points to the actual types from @discura/common.
     */
    /// <reference types="@discura/common/auth" />
    export * from '@discura/common/auth'; // Or specific exports if needed
    ```
2.  **`tsconfig.json`**: Ensure the `typeRoots` in `backend/tsconfig.json` and `frontend/tsconfig.json` include the directory where these `.d.ts` files are placed.
    ```json
    // frontend/tsconfig.json (example)
    "compilerOptions": {
      "typeRoots": ["./node_modules/@types", "./src/types", "../common/dist"] // "./src/types" contains the .d.ts shims
    }
    ```
    And ensure `paths` are correctly set up for `@discura/common/*` submodules.

## Project Status (May 2025)

### Current Tasks & Recent Completions

1.  **Path Alias Resolution & Scoped Package `@discura/common`**: ✅ Completed.
    *   Converted to `@discura/common` scoped package.
    *   Updated `tsconfig.json` files (paths, references, typeRoots).
    *   Fixed import statements project-wide.
    *   Resolved module resolution errors.

2.  **TSOA Migration to Common Package**: ✅ Completed.
    *   Implementations in backend.
    *   Authentication module interface in `common`, implementation in `backend`.
    *   `generate-api-types.sh` script and TSOA configurations updated.

3.  **Type Declaration Generation & Resolution**: ✅ Completed.
    *   Fixed `.d.ts` generation for `@discura/common`.
    *   Addressed implicit type library errors (TS2688 for 'auth', 'routes', 'schema') with explicit `.d.ts` files in `backend/src/types` and `frontend/src/types` (or `frontend/src/shims.d.ts`).
    *   Build process ensures necessary generated files are present.

4.  **API Type Generation Pipeline**: ✅ Completed and Stabilized.
    *   `bootstrap-types.js` correctly detects `@tsoaModel` for all API types.
    *   TSOA controllers correctly reference API types and define routes, ensuring accurate schema generation (e.g., for types like `LLMProvider`, `ImageProvider`).
    *   Circular dependencies in generation process resolved by the established bootstrap mechanism.
    *   Build order (bootstrap -> TSOA spec/routes -> sync types -> build common -> gen frontend client) is confirmed correct and operational.

5.  **Frontend Type Definition Alignment**: ✅ Completed.
    *   Ensured frontend types (e.g., for Bot, User) directly use or correctly alias generated API types via `frontend/src/api/index.ts`, eliminating local overrides and adhering to single source of truth.
    *   Verified that frontend stores and components import API types from `src/api` (or equivalent path to `frontend/src/api/index.ts`).

6.  **Frontend Decorator & Vite Issues**: ✅ Completed.
    *   Configured Vite and frontend `tsconfig.json` to handle experimental decorators if indirectly pulled by dependencies (though TSOA controllers themselves are not directly imported by frontend).
    *   Resolved Vite import resolution for `@discura/common` and its submodules.

7.  **Discord Integration**: ⏳ In Progress.
    *   Ongoing work on bot startup, event handling, and error reporting.

8.  **Database Schema Alignment**: ⏳ In Progress.
    *   Ensuring database schema (Sequelize models) aligns with API types.

### Next Steps

1.  Complete Discord Integration fixes and enhancements.
2.  Develop and refine bot configuration UI components in the frontend.
3.  Enhance LLM tool/function calling capabilities.
4.  Implement comprehensive unit, integration, and end-to-end tests.
5.  Add performance monitoring and logging.
6.  Further enhance error handling and user feedback mechanisms.
7.  Complete all necessary documentation.

## Using Context7

When you're uncertain about how to use a specific program, tool, framework, component, class, or API within the Discura project, leverage Context7 to get up-to-date documentation:

1. **Activate Context7**: Add the phrase `use context7` at the end of your query when asking about any library, API, or framework you're unsure about. For example:
   - "How do I implement TSOA controllers in the common package? use context7"
   - "What's the best way to define API types with @tsoaModel? use context7"
   - "How to use Zustand for state management in our frontend? use context7"

2. **Benefits of Context7**:
   - Retrieves current, version-specific documentation directly from source
   - Provides relevant code examples that work with our project structure
   - Eliminates outdated or hallucinated API references
   - Ensures compatibility with our architecture

3. **When to Use Context7**:
   - When implementing a new feature using an unfamiliar library
   - When troubleshooting API integration issues
   - When uncertain about the correct syntax or usage pattern
   - When documentation from other sources seems outdated or contradictory

Context7 is particularly valuable for understanding correct implementation patterns for TSOA, Sequelize, Discord.js, and other libraries central to our project architecture.

---

**REMEMBER:** The golden rule is to maintain a single source of truth. Define API types in `common/src/types/api/` with `@tsoaModel` decorator, run the generation script, and use the generated files.

**IMPORTANT:** ALL code that is shared between frontend and backend MUST be in the `@discura/common` package. This is not optional - it's the core architectural principle that prevents mismatches. Never duplicate or bypass the common package.

**Note**: NEVER encode hard coded paths, schema, etc. ABSOLUTELY NO hard-coded paths, schema, etc. should exist in files other than the generation files. EVERYTHING of such nature must be generated to keep ONLY and ONLY a single source of truth.

NEVER edit generated files (e.g., `frontend/src/api/generated/`, `frontend/src/api/schema.ts`, `common/src/schema/*`, `common/src/routes/*`). ONLY edit the source of truth (`common/src/types/api/` for API types, `common/src/controllers/` for routes) so the changes will be reflected in the generated files after running `./generate-api-types.sh`.

## Troubleshooting Guide

### Common API Generation Issues

1. **API Types Not Detected**
   * **Problem**: Types with `@tsoaModel` are not being included in generated schema
   * **Solutions**:
     1. Verify the JSDoc format is exactly correct: `/** @tsoaModel */`
     2. Confirm types are in `common/src/types/api/` directory
     3. Set `DEBUG_MODE = true` in `common/scripts/tsoa-bootstrap.js` and run generation again
     4. Check generated temporary files in `common/src/temp/debug/`

2. **TSOA Not Finding Controllers**
   * **Problem**: Routes not generated or missing endpoints
   * **Solutions**:
     1. Ensure controllers are in `common/src/controllers/`
     2. Verify controller class has `@Route()` decorator
     3. Check each endpoint has `@Get()`, `@Post()`, etc. decorators
     4. Confirm `controllerPathGlobs` in `common/tsoa.json` is correct

3. **Import Errors After Generation**
   * **Problem**: TypeScript errors when importing generated types
   * **Solutions**:
     1. **Backend**: Use `import { Type } from '@discura/common/schema/types';`
     2. **Frontend**: Use `import { Type } from 'src/api';` (or path to `frontend/src/api/index.ts`)
     3. Check that `common/dist` contains declaration files
     4. Verify `package.json` dependencies include `"@discura/common": "file:../common"`

4. **API Calls Failing**
   * **Problem**: Frontend API calls return 404 Not Found
   * **Solutions**:
     1. Ensure frontend uses `/api` prefix for all requests
     2. Verify Vite proxy configuration in `frontend/vite.config.ts`
     3. Check backend router registration for `common/dist/routes/routes.js`
     4. Confirm controllers are properly implemented in backend

5. **Type Discrepancies**
   * **Problem**: Frontend and backend have different type definitions
   * **Solutions**:
     1. NEVER define duplicate types
     2. Run `./generate-api-types.sh` after ANY change to API types
     3. Ensure frontend imports ONLY from `frontend/src/api/index.ts`
     4. Verify backend imports from `@discura/common/schema/types`
