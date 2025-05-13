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
- [Controller Injection Mechanism](#controller-injection-mechanism)
- [LLM Provider System](#llm-provider-system)
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
6.  **Backend-Frontend Separation:** Keep all business logic in the backend. Frontend should only handle UI and API client interactions.

## Architecture Overview

Discura is a platform for creating and managing Discord bots powered by LLMs. It has three main components:

-   **Backend**: Node.js/Express with TSOA, serving the API. Implements controller logic defined in the common package.
-   **Frontend**: React + Material UI application. Consumes the API.
-   **Common (`@discura/common`)**: Shared types, constants, TSOA controller definitions, and utilities. This is the single source of truth for all shared code.

### Common Package as Single Source of Truth

The `@discura/common` package is the central repository for all code, type definitions, and constants shared between the frontend and backend. This prevents mismatches and ensures a single source of truth.

1.  **Shared Types**: All type definitions (interfaces, enums, etc.) used by both frontend and backend are managed within the `@discura/common` package.
    *   **API Types** (for HTTP requests/responses) are defined in `common/src/types/api/`, marked with `@tsoaModel`, and then generated.
        *   Backend imports from `@discura/common`.
        *   Frontend imports from `frontend/src/api/` (which are generated from the common package's schema).
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
     // Route constants can be imported from '../types/routes' for method-level routes.
     // import { CONTROLLER_ROUTES, ROUTES } from '../types/routes';

     @Route("llm") // Class-level routes use string literals due to TSOA limitations.
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
       - Creates temporary helper files for type resolution (like `common/src/types/api/tsoa-reference.ts`).
       - Updates the TSOA configuration if necessary.
       - Temporarily patches API type imports in controllers (from `../types` to allow resolution against placeholders in `@discura/common`).
       - Runs TSOA (using `common/tsoa.json`) to process these patched controllers and generate `common/src/schema/swagger.json` (OpenAPI specification).
     - Execute `common/scripts/sync-types.js` to read `common/src/schema/swagger.json` and generate the final, complete type definitions in `common/src/schema/types.ts`, replacing the placeholders
     - Run TSOA again to generate `common/src/routes/routes.ts` (TSOA-generated Express routes)
     - Build the `@discura/common` package
     - Generate the frontend API client code in `frontend/src/api/generated/` and the schema in `frontend/src/api/schema.ts` based on `common/src/schema/swagger.json`
   
   - STEP 4: Import these API types:
     - In backend code (e.g., service implementations): `import { LLMModelData } from '@discura/common';`
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
    *   CRITICAL: This breaks circular dependencies by providing these placeholder types. Controllers import API types from `../types` (as per current practice), 
    *   and the `tsoa-bootstrap.js` script (in the next step) temporarily patches these imports to resolve against these placeholders in `@discura/common`.
    *   This MUST run BEFORE TSOA attempts to generate routes from controllers.

2.  **Run TSOA in the common package**: Generates API schema and routes.
    *   Uses `common/scripts/tsoa-bootstrap.js` to run TSOA with the correct working directory (`common`).
    *   The `tsoa-bootstrap.js` script first temporarily patches API type imports in `common/src/controllers/` (changing them from `../types` to resolve against `@discura/common`).
    *   Then, TSOA (configured by `common/tsoa.json`) processes these patched controllers, using the placeholder API types from `@discura/common/`.
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
| API Types            | `common/src/types/api/*`   | `@tsoaModel` | `@discura/common`        | `src/api` (via `frontend/src/api/index.ts`) |
| Non-API Shared Types | `common/src/types/*`       | None        | `@discura/common/types`               | `@discura/common/types`                 |

#### ABSOLUTELY CRITICAL RULES:
-   API types (request/response DTOs): DEFINE in `common/src/types/api` with `@tsoaModel` -> IMPORT from `@discura/common` (backend) or `src/api` (frontend, via `frontend/src/api/index.ts`).
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
4.  In backend service implementations, import API types from `@discura/common`.
5.  In frontend code, import API types from `src/api` (or `../api` depending on the file location, leveraging `frontend/src/api/index.ts` which re-exports from `./generated`).
6.  NEVER import API types directly from their original definition files (e.g., `common/src/types/api/mytype.ts`) in application logic.

#### For Non-API Shared Types:
1.  Define types DIRECTLY in `common/src/types/` (not in the `/api` subfolder).
2.  Import from `@discura/common/types` in both frontend and backend.
3.  NEVER define non-API shared types with the `@tsoaModel` decorator.

### Debugging API Issues

-   Check `common/tsoa.json` (ensure `basePath` is `""` or correctly set if needed, `entryFile`, `controllerPathGlobs`, and `modelsPathGlobs` are correct). Note: `modelsPathGlobs` includes `"./src/types/api/**/*.ts"` and the generated `"./src/types/api/tsoa-reference.ts"`.
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

## Controller Injection Mechanism

The Discura project uses a controller injection mechanism to enable backend-specific implementations of TSOA controllers defined in the common package, following the "define once, implement many times" pattern:

### Controller Injection Architecture Overview

1. **Common Package**: Defines API contracts using TSOA controllers with placeholder implementations
2. **Backend Package**: Implements the actual controller logic
3. **TSOA Routes**: Generated from common package controllers
4. **Controller Injection**: Runtime mechanism to use backend implementations with TSOA-generated routes

### How Controller Injection Works

The controller injection mechanism in `backend/src/utils/tsoa-controller-injection.ts` ensures that TSOA-generated routes use the backend implementations instead of the placeholder implementations in the common package:

```typescript
// Key steps in the injection process:
1. Find all backend controller implementations
2. Create instances of backend controllers
3. Directly patch methods on the common controller prototypes
4. Bind method implementations to backend controller instances
5. Register the injection before TSOA routes are used
```

When the backend server starts:
1. Backend controller implementations are instantiated
2. Common controller prototype methods are replaced with methods from backend implementations
3. TSOA routes are registered, now pointing to backend implementations
4. Original constructors are restored to avoid memory leaks

### Implementation Notes

- Common controllers throw `"Method not implemented in common package"` errors in their placeholder implementations
- Backend controllers must extend the common controller interfaces (by extending the common controller class)
- The injection happens at runtime through prototype patching rather than compile-time
- Debug logs are available to trace which methods are being patched

### Adding a New Controller

When adding a new controller:
1. Define the interface and placeholder implementation in `common/src/controllers/`:
   ```typescript
   // new-feature.controller.ts in common package
   @Route("new-feature")
   @Tags("New Feature")
   export class NewFeatureController extends Controller {
     @Get()
     public async getFeatures(): Promise<FeatureResponseDto> {
       throw new Error('Method not implemented in common package');
     }
   }
   ```

2. Add the controller to `common/src/controllers/index.ts`

3. Implement the controller in `backend/src/controllers/`:
   ```typescript
   // new-feature.controller.ts in backend package
   import { NewFeatureController as CommonNewFeatureController } from '@discura/common/controllers';
   
   export class NewFeatureController extends CommonNewFeatureController {
     public async getFeatures(): Promise<FeatureResponseDto> {
       // Implementation
       return { features: [...] };
     }
   }
   ```

4. Add the controller to `backend/src/controllers/index.ts`
5. Run the API generation script: `./generate-api-types.sh`

The controller injection mechanism will automatically discover and patch the new controller methods.

### Troubleshooting Controller Injection

If you see `"Method not implemented in common package"` errors:
1. Check that backend controllers properly implement all methods from common controllers
2. Verify controller injection is running before routes are registered
3. Check the debug logs to confirm methods are being patched
4. Ensure backend controller method signatures match common controller definitions exactly

For more detailed information, see `backend/src/utils/README-controller-injection.md`.

## LLM Provider System

Discura implements an LLM (Large Language Model) provider system that integrates with various AI model providers, with a focus on OpenRouter integration and Vercel AI SDK. This system follows the project's core architectural principles:

### Architecture Overview

1. **Backend-Only Integration**: All provider-specific logic, API interactions, and business logic exist ONLY in the backend.
   - Provider discovery, caching, and model mapping live in `backend/src/services/llm.service.ts`
   - OpenRouter API integration resides in `backend/src/services/openrouter.service.ts`
   - Vercel AI SDK integration is handled in `backend/src/services/vercel-ai-sdk.service.ts`

2. **Centralized Types**: Provider and model types are defined in the common package:
   - API types in `common/src/types/api/llm.ts` with `@tsoaModel` decorator
   - Non-API shared types in `common/src/types/llm.ts`

3. **Controller Definition**: The API contract is defined in `common/src/controllers/llm.controller.ts`

4. **Frontend API Client**: Frontend components use the generated API client in `frontend/src/api`

5. **Provider Enum Syncing**: When modifying the `LLMProvider` enum in `common/src/types/llm.ts`, always update the corresponding `LlmProviderConstants` interface in `common/src/types/api/constants.ts` to maintain synchronization between the two. This ensures type safety when using constants in the frontend.

### Provider Integration Architecture

The LLM provider system offers two key integration approaches along with direct provider integration:

#### 1. OpenRouter Native SDK Integration

OpenRouter is implemented using the official `@openrouter/ai-sdk-provider` from the Vercel AI SDK ecosystem:

1. **Native AI SDK Provider**:
   - Uses official `createOpenRouter` function from `@openrouter/ai-sdk-provider`
   - Fully compatible with Vercel AI's streaming primitives
   - Provides direct access to all OpenRouter features with proper type support

2. **Model Variant Slug Handling**:
   - Uses the `model_variant_slug` format for optimal model routing through OpenRouter
   - Backend automatically maps standard model slugs (e.g., `anthropic/claude-3-5-sonnet`) to their corresponding `model_variant_slug` values
   - Special handling for routing endpoints like `auto`, `best`, `fastest`, and `cheapest`

3. **Special Routing Capabilities**:
   - `openrouter/auto`: Automatically selects the best model based on the request
   - `openrouter/best`: Routes to the highest quality model available
   - `openrouter/fastest`: Routes to the fastest-responding model
   - `openrouter/cheapest`: Routes to the most cost-effective model

4. **Configuration**:
   - Configured via `OPENROUTER_KEY` environment variable
   - Optional `OPENROUTER_REFERER` for attribution
   - Custom headers support for proper attribution and tracking

#### 2. Provider-Specific Model Access

Individual provider models can be accessed either directly or through OpenRouter:

1. **Uses Backend Caching**: 
   - Default cache TTL: 24 hours (configurable via environment variables)
   - OpenRouter-specific cache TTL: 12 hours (configurable)
   - Rate limit protections with configurable cool-down periods

2. **Implements Tiered Fallback**:
   - Attempts to fetch from OpenRouter API
   - Falls back to cached data if OpenRouter is unavailable
   - Falls back to default models if cache is missing

#### 3. Vercel AI SDK Integration

The Vercel AI SDK integration provides a flexible, streaming-ready interface to all LLM providers:

1. **Provider Registry**:
   - Dynamically constructs a provider registry based on available API keys
   - Supports all native AI SDK providers: OpenAI, Anthropic, Google, Mistral, Cohere, DeepSeek, Amazon, Azure, Fireworks, TogetherAI, Perplexity, DeepInfra, xAI, Ollama, Hugging Face, Cerebras, ElevenLabs, Gladia, AssemblyAI, Rev.ai, Deepgram, LMNT, Hume, and OpenRouter
   - Allows custom OpenAI-compatible providers with custom endpoints (e.g., Qwen, Chutes, Microsoft, Anyscale, Voyage, LMStudio, etc.)

2. **Environment Configuration**:
   - Providers are configured via environment variables in the format `${PROVIDER}_KEY`
   - Provider availability is determined by the presence of API keys
   - Custom providers can be added through the API with validation

3. **Model Mapping**:
   - Automatic mapping between internal model IDs and provider-specific IDs
   - Support for streaming completions with proper backpressure handling
   - Graceful fallbacks when specific providers are unavailable

4. **Management API**:
   - Enable/disable providers via API endpoints
   - Add/remove/update custom providers through the API
   - Force refresh provider model caches

### Implementation Guidelines

1. **Frontend Components**:
   - Should ONLY fetch model data through the API client: `import { api } from 'src/api'`
   - Must use generated types: `import { LLMCompletionRequestDto } from 'src/api'`
   - Should never implement provider-specific logic or caching

2. **Backend Services**:
   - Implement provider-specific logic and API interactions
   - Handle rate limiting, caching, and error recovery
   - Map external provider formats to internal model structure

3. **Correct API Flow**:
   - Frontend requests model data from backend
   - Backend fetches from external providers or cache
   - Backend processes and returns standardized model data
   - Frontend displays models and handles user selections

4. **Environment Configuration**:
   - Cache durations and rate limits are configurable via environment variables
   - API keys are stored only in backend environment variables
   - Provider status (enabled/disabled) is stored in `provider-config.json`

### Key Files & Components

1. **Backend**:
   - `llm.service.ts`: Main provider registry with caching
   - `openrouter.service.ts`: OpenRouter API integration
   - `vercel-ai-sdk.service.ts`: Vercel AI SDK integration
   - `llm.controller.ts`: API endpoints implementation

2. **Frontend**:
   - API client: Generated from OpenAPI spec
   - `ModelSelector.tsx`: UI component for model selection
   - `LLMChat.tsx`: Example component using selected models

Remember: The backend is the ONLY component that should directly interact with LLM provider APIs. The frontend should ONLY use the API client to retrieve model data and make completion requests.

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

7.  **Controller Injection Mechanism**: ✅ Completed.
    *   Implemented prototype method patching to use backend controller implementations with TSOA routes.
    *   Documented pattern in `backend/src/utils/README-controller-injection.md`.
    *   Fixed "Method not implemented in common package" errors.

8.  **Discord Integration**: ⏳ In Progress.
    *   Ongoing work on bot startup, event handling, and error reporting.
    *   Updating message handling with proper channel type checking
    *   Implementing error recovery for disconnections

9.  **Database Schema Alignment**: ⏳ In Progress.
    *   Ensuring database schema aligns with API types.
    *   Implementing adapter pattern consistently across all models

10. **OpenRouter Integration**: ✅ Completed.
    *   Implemented backend provider registry with OpenRouter API
    *   Added tiered caching system with configurable TTLs
    *   Implemented rate limiting protections
    *   Added support for latest model variants

### Next Steps

1.  Complete Discord Integration fixes and enhancements.
2.  Develop and refine bot configuration UI components in the frontend.
3.  Enhance LLM tool/function calling capabilities.
4.  Implement comprehensive unit, integration, and end-to-end tests.
5.  Add performance monitoring and logging.
6.  Further enhance error handling and user feedback mechanisms.
7.  Complete all necessary documentation.

## Using Context7: resolve-library-id & get-library-docs

When you're uncertain about how to use a specific program, tool, framework, component, class, or API within the Discura project, leverage Context7 to get up-to-date documentation:

1. **Benefits of Context7**:
   - Retrieves current, version-specific documentation directly from source
   - Provides relevant code examples that work with our project structure
   - Eliminates outdated or hallucinated API references
   - Ensures compatibility with our architecture

2. **When to Use Context7**:
   - When implementing a new feature using an unfamiliar library
   - When troubleshooting API integration issues
   - When uncertain about the correct syntax or usage pattern
   - When documentation from other sources seems outdated or contradictory

3. **How to Use Context7**:
   - First call `resolve-library-id` with the library name to get the correct Context7 library ID
   - Then call `get-library-docs` with the returned ID to fetch accurate documentation

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
     1. **Backend**: Use `import { Type } from '@discura/common';`
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
     4. Verify backend imports from `@discura/common`

6. **Controller Implementation Errors**
   * **Problem**: Seeing "Method not implemented in common package" errors
   * **Solutions**:
     1. Ensure backend controllers properly extend the common controllers
     2. Check that all required methods are implemented in the backend controllers
     3. Verify controller injection is running before routes are registered (in `backend/src/index.ts`)
     4. Set the logging level to `debug` to see detailed patching information
     5. Ensure method signatures match exactly between common and backend controllers

7. **OpenRouter Integration Issues**
   * **Problem**: OpenRouter models not appearing or rate limits being hit
   * **Solutions**:
     1. Check environment variable `USE_OPENROUTER` is set to `true`
     2. Verify OpenRouter API key is properly set in backend `.env`
     3. Adjust cache TTLs via environment variables if needed: `OPENROUTER_CACHE_TTL`, `MODEL_CACHE_TTL`
     4. Check backend logs for rate limiting warnings
     5. Ensure frontend is properly requesting models through the API client
