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
- [Discord Integration](#discord-integration)
- [Project Status](#project-status)
- [TypeScript Error Resolution](#typescript-error-resolution)
- [Using Context7](#using-context7)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Database Patterns](#database-patterns)
- [Testing & Quality Assurance](#testing--quality-assurance)

## Core Mandates

> These rules are non-negotiable and must be followed without exception.

1. **Single Source of Truth:** Define API types in `common/src/types/api/` with `@tsoaModel` JSDoc tag, and routes in TSOA controllers in `common/src/controllers/`.
2. **Use Generation Pipeline:** ALWAYS run `./generate-api-types.sh` after changing API types or controllers.
3. **NO Hard-Coding:** NEVER hard-code API paths or types. Use generated code and route constants.
4. **NO Editing Generated Files:** NEVER edit files created by the generation script (in `common/src/schema/`, `common/src/routes/`, `frontend/src/api/generated/`).
5. **Common Package Centralization:** ALL shared code MUST be in the `@discura/common` package.
6. **Backend-Frontend Separation:** Keep all business logic in the backend. Frontend should only handle UI and API calls.

## Architecture Overview

Discura is a platform for creating Discord bots powered by LLMs, with three main components:

- **Backend**: Node.js/Express with TSOA API
- **Frontend**: React + Material UI application
- **Common (`@discura/common`)**: Shared types, constants, and TSOA controller definitions

## Type System Guide

There are TWO distinct types of shared types in Discura:

### 1. API Types (HTTP Requests/Responses)

1. **Define** types in `common/src/types/api/` with `@tsoaModel` tag:
   ```typescript
   /**
    * @tsoaModel
    */
   export interface LLMModelData {
     id: string;
     object: string;
     created: number;
     owned_by: string;
   }
   ```

2. **Reference** in TSOA controllers:
   ```typescript
   // common/src/controllers/llm.controller.ts
   @Route("llm")
   export class LLMController extends Controller {
     @Get('models')
     @Security("jwt")
     public async getModels(): Promise<LLMModelsResponseDto> {
       throw new Error('Method not implemented in common package');
     }
   }
   ```

3. **Generate** types: Run `./generate-api-types.sh`

4. **Import** properly:
   - Backend: `import { LLMModelData } from '@discura/common';`
   - Frontend: `import { LLMModelData } from 'src/api';`

### 2. Non-API Shared Types (Internal Logic)

1. **Define** directly in `common/src/types/` (not in `/api/`):
   ```typescript
   // common/src/types/index.ts
   export enum BotStatus {
     OFFLINE = 'OFFLINE',
     ONLINE = 'ONLINE',
     ERROR = 'ERROR'
   }
   ```

2. **Import** directly:
   - Backend: `import { BotStatus } from '@discura/common/types';`
   - Frontend: `import { BotStatus } from '@discura/common/types';`

### Critical Import Rules

- API types: Import from generated sources ONLY
  - Backend: `@discura/common`
  - Frontend: `src/api`
- Non-API types: Import from `@discura/common/types`
- NEVER import API types directly from their source definition files

## Controller Injection System

The backend implements controller injection to use backend implementations with TSOA routes:

1. **Define** controllers in `common/src/controllers/` with placeholder implementations.
2. **Implement** in the backend by extending common controllers:
   ```typescript
   // backend/src/controllers/feature.controller.ts
   import { FeatureController as CommonFeatureController } from '@discura/common/controllers';
   
   export class FeatureController extends CommonFeatureController {
     public async getFeatures(): Promise<FeatureResponseDto> {
       // Implementation here
       return { features: [...] };
     }
   }
   ```
3. **Add** to `backend/src/controllers/index.ts` for automatic injection.

## LLM Provider System

Discura integrates with various LLM providers through a unified backend system:

### Key Components

1. **Provider Registry**: Dynamic provider management in `backend/src/services/llm.service.ts`
2. **OpenRouter Integration**: Primary integration path with caching and fallbacks
3. **Vercel AI SDK Integration**: Unified interface to all supported providers

### Implementation Rules

1. **Frontend Components**:
   - Use only the API client: `import { LlmService } from 'src/api'`
   - Never implement provider-specific logic
   - Use the full model ID format directly from the API (`provider/model-name`)
   
2. **Backend Services**:
   - Implement provider integrations and caching
   - Handle model mappings and error recovery

3. **Provider Configuration**:
   - API keys stored only in backend environment variables
   - Provider enablement status in `provider-config.json`

### Model Selection and Provider Handling

1. **Frontend Model Handling**:
   
   - **NEVER manually parse model IDs**:
   
     ```typescript
     // INCORRECT - Manual parsing
     const parts = selectedModel.split('/');
     const provider = parts[0];
     const model = parts.slice(1).join('/');
     ```
   
   - **DO use the complete model ID directly from the API**:
   
     ```typescript
     // CORRECT - Use model IDs directly from the API
     const modelId = "openai/gpt-4o"; // From ModelSelector component
     
     // When updating configuration:
     const updatedConfig = {
       ...currentConfig,
       llmModel: modelId
     };
     ```
   
   - **ALWAYS query the API for model data** instead of hard-coding provider mappings:
   
     ```typescript
     // CORRECT - Get model data from the API
     const modelResponse = await LlmService.getAllProviderModels();
     const providerData = modelResponse.providers.find(
       p => p.models.some(m => m.id === selectedModel)
     );
     ```

2. **Model Selection Components**:

   - Use the `ModelSelector` component for consistent UI
   - The component should receive model IDs directly from the API
   - Pass the complete model ID to parent components via callback
   
   ```typescript
   <ModelSelector
     onModelSelect={(modelId) => setSelectedModel(modelId)}
     defaultModel={currentBot?.configuration?.llmModel}
   />
   ```

3. **Provider-Model Association**:

   - Backend returns model data with full provider context:
   
     ```json
     {
       "id": "anthropic/claude-3.5-sonnet",
       "provider_model_id": "claude-3-5-sonnet",
       "display_name": "Claude 3.5 Sonnet",
       "provider_display_name": "Anthropic"
     }
     ```
     
   - Frontend should use these fields directly without transformation

### Best Practices

1. **API Data Transformation**:
   - Minimize data transformation in frontend components
   - Use backend-provided data structures directly
   - Never create custom identifiers for provider/model relationships

2. **Configuration Updates**:
   - Pass complete model information when updating configurations
   - Let the backend handle provider-specific logic
   - Use typed DTOs for all configuration updates

## Using Context 7
Context7 MCP pulls up-to-date, version-specific documentation and code examples straight from the source

resolve-library-id: Resolves a general library name into a Context7-compatible library ID.
libraryName (required)
get-library-docs: Fetches documentation for a library using a Context7-compatible library ID.
context7CompatibleLibraryID (required)
topic (optional): Focus the docs on a specific topic (e.g., "routing", "hooks")
tokens (optional, default 10000): Max number of tokens to return. Values less than the configured DEFAULT_MINIMUM_TOKENS value or the default value of 10000 are automatically increased to that value.


## Common TypeScript Errors and Solutions

### 1. Enum Value vs Enum Type Errors

```typescript
// INCORRECT
const config = {
  llmProvider: typeof LLMProvider, // Error: Type 'typeof LLMProvider' is not assignable
};

// CORRECT
const config = {
  llmProvider: LLMProvider.OPENAI, // Use specific enum value
};
```

### 2. Import Resolution Errors

```typescript
// INCORRECT
import { CreateBotRequest } from '../api';

// CORRECT
import { CreateBotRequestDto } from '../api';
```

### 3. Discord.js Type Guards

```typescript
// INCORRECT
channel.send("Hello"); // Error: Property 'send' does not exist on type 'Channel'

// CORRECT
if (channel.isTextBased()) {
  channel.send("Hello"); // Now TypeScript knows this is a TextBasedChannel
}
```

## Troubleshooting Guide

### API Generation Issues

1. **Types not detected**:
   - Verify JSDoc format: `/** @tsoaModel */`
   - Confirm types are in `common/src/types/api/`
   - Set `DEBUG_MODE = true` in bootstrap script

2. **Missing routes**:
   - Ensure controllers have `@Route()` decorator
   - Verify endpoints have `@Get()`, `@Post()`, etc.

3. **Import errors**:
   - Backend: Use `import { Type } from '@discura/common';`
   - Frontend: Use `import { Type } from 'src/api';`

4. **"Method not implemented"** errors:
   - Ensure backend controllers extend common controllers
   - Verify all required methods are implemented 
   - Check method signatures match exactly

## Best Practices

1. **Model names for custom providers**: Use the format `provider/model-name` (e.g., `chutes/lambda-70b`)

2. **Type mappings**: Use explicit mapping functions between database models and API types:
   ```typescript
   function toBotResponseDto(model: BotModel): BotResponseDto {
     return {
       id: model.id,
       name: model.name,
       // Map other fields as needed
     };
   }
   ```

3. **Error handling**: Implement proper error recovery and status reporting:
   ```typescript
   try {
     const result = await operation();
     return result;
   } catch (error) {
     logger.error('Operation failed:', error);
     throw new OperationError('Failed to perform operation', error);
   }
   ```

---

**GOLDEN RULE:** Maintain a single source of truth. Define API types in `common/src/types/api/` with `@tsoaModel` decorator, run the generation script, and use the generated files. NEVER duplicate or bypass the common package. NEVER edit generated files manually.
