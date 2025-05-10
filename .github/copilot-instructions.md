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

1.  **Single Source of Truth:** Define API types in `common/src/types/api/` with `@tsoaModel` JSDoc tag, and routes in TSOA controllers located in `common/src/controllers/`. Use route constants from `@discura/common/types/routes`.
2.  **Use Generation Pipeline:** ALWAYS run `./generate-api-types.sh` from the project root after changing API types or controllers.
3.  **NO Hard-Coding:** NEVER hard-code API paths or types. Use generated code and route constants.
4.  **NO Editing Generated Files:** NEVER edit files created by the generation script (e.g., in `common/src/schema/`, `common/src/routes/`, `frontend/src/api/generated/`).
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
   
   - STEP 2: Define/update TSOA controllers in `common/src/controllers/` that reference these API types. Controllers import API types from `@discura/common/schema/types`.
     ```typescript
     // EXAMPLE - common/src/controllers/llm.controller.ts
     import { Controller, Get, Route, Security, Tags } from 'tsoa';
     import { LLMModelsResponseDto } from '@discura/common/schema/types'; // Correct import
     import { ROUTES } from '@discura/common/types/routes';

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
     
   - STEP 3: Run `./generate-api-types.sh` from the project root. This script will:
     - Execute `common/scripts/bootstrap-types.js` to scan `common/src/types/api` for `@tsoaModel` types and create initial placeholder definitions in `common/src/schema/types.ts`. This breaks circular dependencies.
     - Execute `common/scripts/tsoa-bootstrap.js` which runs TSOA (using `common/tsoa.json`) to generate:
        - `common/src/schema/swagger.json` (OpenAPI specification) based on controllers in `common/src/controllers/` and API types from `common/src/schema/types.ts` (initially placeholders).
        - `common/src/routes/routes.ts` (TSOA-generated Express routes).
     - Execute `common/scripts/sync-types.js` to read `common/src/schema/swagger.json` and generate the final, complete type definitions in `common/src/schema/types.ts`, replacing the placeholders.
     - Build the `@discura/common` package.
     - Generate the frontend API client code in `frontend/src/api/generated/` based on `common/src/schema/swagger.json`.
   
   - STEP 4: Import these API types:
     - In backend code (e.g., service implementations): `import { LLMModelData } from '@discura/common/schema/types';`
     - In frontend code: `import { LLMModelData } from 'src/api';` (this path assumes `baseUrl: "src"` in `frontend/tsconfig.json` or a similar setup; adjust to `../api` or an alias like `@/api` as per your project's specific path resolution from `frontend/src/api/index.ts`).

   - CRITICAL: NEVER import API types directly from their original definition files (e.g., `common/src/types/api/llm.ts`) into controllers or application logic. ALWAYS use the generated paths.

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
2.  Update TSOA controllers in `common/src/controllers/` with new/modified routes referencing these API types (importing them from `@discura/common/schema/types`).
3.  Run `./generate-api-types.sh` from the project root (MANDATORY).
4.  Implement the actual controller logic in the backend package, extending or using the TSOA-generated routes and common controller definitions.
5.  Use the generated types/API client in the frontend and backend as per the "Type System Flow".

### Type Definition Workflow

The proper type definition workflow varies based on the type of type:

#### For API Types (Request/Response Types):
1.  Define types with `@tsoaModel` decorator in `common/src/types/api/`.
2.  Generate using `./generate-api-types.sh`.
3.  ALWAYS import these types from `@discura/common/schema/types` in backend code (including TSOA controllers in `common`).
4.  ALWAYS import these types from `src/api` (or `../api` depending on the file location, leveraging `frontend/src/api/index.ts` which re-exports from `./generated`) in frontend code.
5.  NEVER import API types directly from their original definition files (e.g., `common/src/types/api/mytype.ts`).

#### For Non-API Shared Types:
1.  Define types DIRECTLY in `common/src/types/` (not in the `/api` subfolder).
2.  Import from `@discura/common/types` in both frontend and backend.
3.  NEVER define non-API shared types with the `@tsoaModel` decorator.

### Debugging API Issues

-   Check `common/tsoa.json` (ensure `basePath` is `""` or correctly set if needed, `entryFile`, `controllerPathGlobs` are correct).
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

The `generate-api-types.sh` script depends on correct path resolution:

1.  **Bootstrap Script (`common/scripts/bootstrap-types.js`)**: Must correctly resolve paths to `common/src/types/api` to find `@tsoaModel` types.
    ```javascript
    // Example path resolution in bootstrap-types.js:
    const rootDir = path.resolve(__dirname, '..', '..'); // Resolves to project root from common/scripts
    const typesApiDir = path.join(rootDir, 'common', 'src', 'types', 'api');
    const typesGlob = path.join(typesApiDir, '**/*.ts');
    ```
2.  **TSOA Configuration (`common/tsoa.json`)**: Paths for `entryFile`, `controllerPathGlobs`, and output directories must be correct relative to the `common` package root (where TSOA is executed by `tsoa-bootstrap.js`).
3.  **Type Discovery Issues**: If API types aren't being found or generated correctly:
    *   Check path resolution in `bootstrap-types.js`.
    *   Verify API type files exist in `common/src/types/api/`.
    *   Ensure the `@tsoaModel` decorator is correctly applied in JSDoc comments.
    *   Ensure controllers in `common/src/controllers` import API types from `@discura/common/schema/types`.

### Absolutely DO NOT

-   ❌ Edit any generated files (e.g., `frontend/src/api/generated/*`, `common/src/schema/*`, `common/src/routes/routes.ts`).
-   ❌ Hard-code API paths in frontend or backend code; use generated clients or route constants.
-   ❌ Define API types outside of `common/src/types/api/`.
-   ❌ Add leading slashes to TSOA `@Route` paths (e.g., use `@Route("bots")` not `@Route("/bots")`).
-   ❌ Import API types into the frontend directly from `@discura/common/schema/types` or `@discura/common/src/types/api/*`. Use the generated frontend client, accessed via `src/api` (or `../api`, from `frontend/src/api/index.ts`).
-   ❌ Import types directly between controllers if they are API types; use `@discura/common/schema/types`.
-   ❌ Duplicate type definitions across frontend, backend, or within common.
-   ❌ Define shared logic or constants outside the `@discura/common` package.
-   ❌ Define non-API shared types with the `@tsoaModel` decorator or place them in `common/src/types/api/`.

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

## Module Resolution

### Common Package as Scoped Package

The "common" package is implemented as a scoped package `@discura/common` for both frontend and backend:

1.  **Import Pattern**: Use the scoped package name for imports.
    ```typescript
    // Correct
    import { MyApiType } from "@discura/common/schema/types";
    import { MySharedUtil } from "@discura/common/utils"; // Assuming utils are exported
    import { MyNonApiType } from "@discura/common/types";

    // Incorrect (old style or direct relative paths across packages)
    // import { Something } from "common/types";
    // import { Something } from "../common/src/types";
    ```

2.  **Package Configuration**: `backend/package.json` and `frontend/package.json` list `@discura/common` as a file dependency:
    ```json
    // backend/package.json and frontend/package.json
    "dependencies": {
      "@discura/common": "file:../common",
      // other dependencies...
    }
    ```
    After `npm install`, this creates a symlink in `node_modules/@discura/common`.

3.  **Type Resolution (TypeScript `tsconfig.json`)**:
    *   **`paths`**: Each package's `tsconfig.json` should configure `paths` to map `@discura/common` to its location. This is crucial for development when the symlink might not be immediately recognized by the editor or for build tools.
        ```json
        // In backend/tsconfig.json and frontend/tsconfig.json
        {
          "compilerOptions": {
            "baseUrl": ".", // Or "src" if source files are in src
            "paths": {
              "@discura/common": ["../common"], // Points to the common package directory
              "@discura/common/*": ["../common/src/*", "../common/dist/*"] // Specific sub-paths
            }
          }
        }
        ```
    *   **`typeRoots`**: Include `../common/dist` (or the symlinked path via `node_modules/@discura/common/dist`) if necessary, though `paths` and project references are generally preferred. The main `typeRoots` are usually `./node_modules/@types`.
        ```json
        // In backend/tsconfig.json and frontend/tsconfig.json
        "typeRoots": ["./node_modules/@types", "../common/dist"]
        ```
    *   **`references`**: Project references are key for monorepo setups. Each package (`backend`, `frontend`) should reference the `common` package. The root `tsconfig.json` can also manage these.
        ```json
        // In backend/tsconfig.json and frontend/tsconfig.json
        "references": [{ "path": "../common" }]

        // In root tsconfig.json (if using solution-style builds)
        "references": [
            { "path": "./common" },
            { "path": "./backend" },
            { "path": "./frontend" }
        ]
        ```
    *   **`composite: true`**: Required in `tsconfig.json` for packages that are referenced by others. `common/tsconfig.json` must have this.

### Shared Code Pattern

1.  **Define Once**: All shared code (types, constants, utilities, TSOA controller definitions) in `@discura/common`.
2.  **Import Correctly**: Use the scoped package import `@discura/common/*`.
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
    *   `common/tsconfig.json`: Extends base, `composite: true`, specific settings for common lib.
    *   `backend/tsconfig.json`: Extends base, references `common`.
    *   `frontend/tsconfig.json`: Extends base, references `common`, ESM specific settings.
3.  **Special-Purpose Configurations**:
    *   `common/tsconfig.tsoa.json`: Used by TSOA during generation, configured within `common/tsoa.json`. It should align with `common/tsconfig.json` but might have specific overrides for TSOA's needs (e.g., ensuring it can resolve types from `@discura/common/schema/types` during generation).
    *   `frontend/tsconfig.node.json`: For Vite config file (`vite.config.ts`) itself, if it needs different settings (e.g., `module: CommonJS` if Vite config isn't ESM).
    *   `frontend/tsconfig.app.json` (if present): Might be used by Vite for the application code, often similar to `frontend/tsconfig.json`.

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
    *   Import API types from `@discura/common/schema/types`.
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
    *   Ensure `compilerOptions` within `tsoa.json` are compatible and allow resolving `@discura/common/schema/types`.

5.  **Working Directory**: `generate-api-types.sh` ensures TSOA runs via `common/scripts/tsoa-bootstrap.js`, which sets the working directory to `common/`.

## API Type Troubleshooting

### Circular Dependencies

1.  **Bootstrap Before TSOA**: `bootstrap-types.js` (creates placeholders in `common/src/schema/types.ts`) MUST run before TSOA generates routes. This is handled by `generate-api-types.sh`.
2.  **Controller Imports**: Controllers in `common/src/controllers` MUST import API types from `@discura/common/schema/types` (which are initially placeholders).
3.  **Non-API Type Dependencies**: If a Non-API shared type (defined in `common/src/types/`, not `common/src/types/api/`) needs to reference a type that originates from an API definition (i.e., defined in `common/src/types/api/` and later generated into `@discura/common/schema/types`), the Non-API type should import it from the generated path (`@discura/common/schema/types`) after the generation process. Direct imports from `common/src/types/api/*` into `common/src/types/*` files are problematic before generation. If such a dependency is needed for internal logic and might cause issues during the initial bootstrap phase (before `common/src/schema/types.ts` is fully populated), consider using a generic type (e.g., `string` for an enum) in the Non-API type as a temporary measure, or ensure the shared concept is primarily defined as a Non-API type if its use is broader than just the API contract.
    ```typescript
    // common/src/types/index.ts
    // Example of a Non-API shared type
    export interface MyInternalDataObject { 
      id: string;
      name: string;
      // If ApiSpecificStatus is an enum defined in common/src/types/api/ and generated to @discura/common/schema/types,
      // import it from '@discura/common/schema/types' here.
      // import { ApiSpecificStatus } from '@discura/common/schema/types'; // This is fine AFTER generation
      // status: ApiSpecificStatus; 

      // If direct import from common/src/types/api/* is attempted before generation, it can fail.
      // For such cases, or if it's a truly internal status distinct from API:
      internalStatus: string; // Or map to a dedicated Non-API MyInternalStatusEnum
    }
    ```
    The `BotStatus` enum example in the guidelines (defined in `common/src/types/index.ts`) is a Non-API shared type, which is the correct approach for enums/types used purely for internal logic across frontend/backend and not primarily as data structures for API request/responses.

### TSOA Controller Import Issues

Correct import patterns for `common/src/controllers/*.ts`:
1.  **TSOA Components**: `import { Body, Controller, Get, ... } from 'tsoa';`
2.  **API Types**: `import { UserResponseDto, CreateBotRequest } from '@discura/common/schema/types';` (CRITICAL)
3.  **Non-API Shared Types**: `import { SomeInternalEnum } from '@discura/common/types';`
4.  **Route Constants**: `import { ROUTES } from '@discura/common/types/routes';`
5.  **Express Request**: `import { Request as ExpressRequest } from 'express';` (for `@Request()` decorator)

### Script Execution and Clean Build

1.  **`./generate-api-types.sh`**: Always run from project root after changes to `common/src/types/api/` or `common/src/controllers/`.
2.  **`common` prebuild script**: `common/package.json` has a `prebuild` script that attempts to run `generate-api-types.sh` if `src/schema` or `src/routes` are missing.
3.  **Full Clean Build**:
    ```bash
    npm run clean # In root, or per package
    npm run install # In root, to relink @discura/common
    ./generate-api-types.sh
    npm run build # In root (or common, then backend, then frontend)
    ```
    The `common` package might have `npm run build:full` which does `npm run clean && cd .. && ./generate-api-types.sh && npm run build`.

4.  **Missing Declaration Files (`.d.ts`) for `@discura/common`**:
    *   Ensure `@discura/common` built successfully (`npm run build -w @discura/common` or via root build).
    *   Check `common/dist` for `.d.ts` files.
    *   Ensure `frontend/tsconfig.json` and `backend/tsconfig.json` correctly reference `common` (via `paths` and `references`).
    *   The `auth.d.ts`, `routes.d.ts`, `schema.d.ts` files in `backend/src/types` and `frontend/src/types` (or `frontend/src/shims-*.d.ts`) are crucial for resolving implicit type library errors if `typeRoots` in `tsconfig.json` includes these directories for that purpose.

### TSOA Decorator Detection

1.  **JSDoc Format**: `@tsoaModel` must be in a JSDoc block:
    ```typescript
    /**
     * My API Model.
     * @tsoaModel
     */
    export interface MyApiModel { /* ... */ }
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
    *   TSOA controllers defined in `common/src/controllers`.
    *   Implementations in backend.
    *   Authentication module interface in `common`, implementation in `backend`.
    *   `generate-api-types.sh` script and TSOA configurations updated.

3.  **Type Declaration Generation & Resolution**: ✅ Completed.
    *   Fixed `.d.ts` generation for `@discura/common`.
    *   Addressed implicit type library errors (TS2688 for 'auth', 'routes', 'schema') with explicit `.d.ts` files in `backend/src/types` and `frontend/src/types` (or `frontend/src/shims.d.ts`).
    *   Build process ensures necessary generated files are present.

4.  **API Type Generation Pipeline**: ✅ Completed.
    *   `bootstrap-types.js` correctly detects `@tsoaModel`.
    *   Circular dependencies in generation process resolved.
    *   Build order (bootstrap -> TSOA spec/routes -> sync types -> build common -> gen frontend client) is correct.

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

---

**REMEMBER:** The golden rule is to maintain a single source of truth. Define API types in `common/src/types/api/` with `@tsoaModel` decorator, run the generation script, and use the generated files.

**IMPORTANT:** ALL code that is shared between frontend and backend MUST be in the `@discura/common` package. This is not optional - it's the core architectural principle that prevents mismatches. Never duplicate or bypass the common package.

**Note**: NEVER encode hard coded paths, schema, etc. ABSOLUTELY NO hard-coded paths, schema, etc. should exist in files other than the generation files. EVERYTHING of such nature must be generated to keep ONLY and ONLY a single source of truth.

NEVER edit generated files (e.g., `frontend/src/api/generated/`, `frontend/src/api/schema.ts`, `common/src/schema/*`, `common/src/routes/*`). ONLY edit the source of truth (`common/src/types/api/` for API types, `common/src/controllers/` for routes) so the changes will be reflected in the generated files after running `./generate-api-types.sh`.
