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
- [Vision Model Integration](#vision-model-integration)
- [Discord Integration](#discord-integration)
- [Project Status](#project-status)
- [TypeScript Error Resolution](#typescript-error-resolution)
- [Using Context7](#using-context7)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Database Patterns](#database-patterns)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Tool Capability Support](#tool-capability-support)

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
2. **OpenRouter Integration**: 
   - Primary model discovery service that provides up-to-date information on available LLM providers and models
   - Optional LLM provider that can be used as a fallback
   - Provides a unified API for accessing multiple LLM providers
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

### Model ID Format and Usage

1. **Model ID Types**:
   
   - **OpenRouter Format (`id`)**: The format is lowercased and joined by characters to make it URL friendly `model-name` (e.g., `gpt-4o`) is used by OpenRouter. `qwen-2-32b-max` for Qwen instead of official `Qwen-2-32b-Max`.
   
   - **Native Provider Format (`provider_model_id`)**: The original ID used by native providers (e.g., `gpt-4o` for OpenAI, `Qwen-2-32b-Max` for Qwen).
   
   - When working with model selection in the frontend, use `provider_model_id` as it is compatible with direct API calls to the original providers. When using OpenRouter as the provider itself, use `id`.

2. **Model Selection Best Practices**:
   
   - Use `provider_model_id` for model selection in components like `ModelSelector`
   - Don't manually parse or transform model IDs in the frontend
   - Let the backend handle any necessary transformations between formats

### OpenRouter's Dual Role

1. **Model Discovery Service**:
   - Provides a comprehensive, up-to-date catalog of available models across multiple providers
   - Used to populate model selection UI components with the latest available models
   - Synced periodically to ensure availability of new models (`fetch-openrouter-models.js` script)
   - Cached locally (`provider-models-cache.json`) for performance and availability

2. **Optional LLM Provider**:
   - Can be used as a direct provider when desired
   - Serves as a fallback when direct provider access is unavailable
   - When using OpenRouter as a provider directly, use the OpenRouter format model IDs (`id`)

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

## Vision Model Integration

Discura supports multimodal AI capabilities through vision models that can process and understand images shared in Discord.

### Key Components

1. **Image Processing Pipeline**:
   - Image attachments in Discord messages are automatically detected and processed
   - The URL of image attachments is extracted and passed to the LLM service
   - The vision model receives both the text query and image URLs

2. **Message Handling**:
   - The system detects image attachments using Discord.js's attachment handling
   - If an image is attached without text, a default prompt is used: "Can you describe what's in this image?"
   - If an image is attached with text, the text serves as context for the image analysis

3. **Multimodal Content Formatting**:
   - Images are formatted as multimodal content for the LLM following this structure:
     ```typescript
     userMessageContent = [
       { type: "text", text: prompt },
       ...imageURLs.map(url => ({ 
         type: "image", 
         image_url: { url }
       }))
     ];
     ```

### Implementation Details

1. **Image Attachment Detection**:
   ```typescript
   // Check if message has image attachments
   const hasImageAttachments = message.attachments.size > 0 && 
     message.attachments.some(attachment => 
       attachment.contentType?.startsWith('image/'));
   ```

2. **Image URL Extraction**:
   ```typescript
   // Extract image URLs from attachments for vision processing
   const imageURLs: string[] = [];
   if (hasImageAttachments) {
     message.attachments.forEach(attachment => {
       if (attachment.contentType?.startsWith('image/')) {
         imageURLs.push(attachment.url);
       }
     });
   }
   ```

3. **LLM Function Call**:
   ```typescript
   const response = await callLLM({
     // ...other parameters
     imageUrls: imageURLs.length > 0 ? imageURLs : undefined,
     visionModel: imageURLs.length > 0 ? bot.configuration?.visionModel : undefined
   });
   ```

### Best Practices

1. **Vision Model Configuration**:
   - Configure vision-capable models in the bot settings
   - Use vision-specific models (when available) that are optimized for multimodal content

2. **Content Format Validation**:
   - Ensure image URLs are accessible by the vision model
   - Verify that image formats are supported (typically JPEG, PNG, GIF, and WebP)

3. **Error Handling**:
   - Implement fallbacks for when image processing fails
   - Log specific errors related to vision model processing for debugging

4. **Testing**:
   - Test with various image formats and sizes
   - Test with combinations of text and images
   - Verify handling of invalid or inaccessible image URLs

### Vision Model Selection

When selecting vision models in the frontend, follow these guidelines:

1. **Model Compatibility**:
   - Only use models that are explicitly marked as vision-capable
   - Frontend should filter models based on vision capability flags

2. **UI Integration**:
   - Clearly indicate to users when vision capabilities are available
   - Provide guidance on supported image formats and optimal sizes

3. **Performance Considerations**:
   - Vision models may have higher token costs
   - Consider rate limiting or usage controls for vision features

## Using Context7

Context7 MCP pulls up-to-date, version-specific documentation and code examples straight from the source. It MUST be used when working with any framework, SDK, tool, or program that you are not completely familiar with.

### When to Use Context7

1. **MANDATORY Use Cases**:
   - When integrating with an external library or framework not previously used in the project
   - When using a library or framework you are not confident in
   - When implementing features that require specific API calls or patterns not already present in the codebase
   - When you need to validate your understanding of a framework's behavior or API

2. **Recommended Use Cases**:
   - For staying current with latest features of libraries already used in the project
   - When troubleshooting complex issues related to third-party dependencies
   - To verify best practices for specific frameworks (like React, Material UI, Discord.js, etc.)

### Benefits of Context7

1. **Up-to-date Documentation**: Documentation is refreshed daily, ensuring you have access to the latest API changes and features
2. **Working Code Examples**: Provides functional code snippets that demonstrate proper usage patterns
3. **Version-Specific Information**: Gives information relevant to the specific versions used in the project
4. **Reduced Trial-and-Error**: Minimizes the need for experimental implementation attempts

### How to Use Context7

```
resolve-library-id: Resolves a general library name into a Context7-compatible library ID.
- libraryName (required): Name of the library to resolve (e.g., "discord.js")

get-library-docs: Fetches documentation for a library using a Context7-compatible library ID.
- context7CompatibleLibraryID (required): Library ID obtained from resolve-library-id
- topic (optional): Focus the docs on a specific topic (e.g., "routing", "hooks") 
- tokens (optional, default 10000): Maximum number of tokens to return
```

### Example Usage

1. First, resolve the library ID:
   ```
   resolve-library-id with "discord.js"
   ```

2. Then, get specific documentation:
   ```
   get-library-docs with "discordjs/discord.js" and topic "message components"
   ```

By using Context7 for all unfamiliar frameworks or tools, you'll ensure that implementations follow the most current best practices and API specifications.

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

### Vision Processing Issues

1. **Images not being processed**:
   - Verify image URLs are correctly extracted from attachments
   - Check that image URLs are properly formatted for the vision model
   - Ensure the selected model supports vision capabilities

2. **Vision model not responding to images**:
   - Confirm the multimodal content formatting is correct
   - Verify the provider's vision model is properly configured
   - Check the response format expected by the vision model

3. **Poor image analysis quality**:
   - Try using a more capable vision model
   - Improve the prompt context to guide the model's analysis
   - Ensure image resolution and format are optimal

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

4. **Vision model integration**: Format multimodal content correctly:
   ```typescript
   // Format as multimodal content with text + images
   userMessageContent = [
     { type: "text", text: request.prompt },
     ...request.imageUrls.map(url => ({ 
       type: "image", 
       image_url: { url }
     }))
   ];
   ```

## Tool Capability Support

Discura supports Tool Calling capabilities to allow Discord bots to interact with external services, databases, and APIs. This feature requires models that explicitly support function/tool calling.

### Key Components

1. **Model Capability Detection**:
   - Frontend automatically checks if the selected model supports tool calling via the `capabilities.supports_tool_calling` property
   - The Tools tab is only enabled for models that support tool calling
   - Users receive clear feedback when trying to use tools with incompatible models

2. **Configuration Flow**:
   - The `toolsEnabled` flag in `BotConfiguration` controls whether tool functionality is active
   - Even if a model supports tool calling, the bot owner must explicitly enable it
   - Tools are defined in the bot configuration and stored in the database

3. **Execution Pipeline**:
   - When a model returns tool calls in its response, the backend processes them only if `toolsEnabled` is true
   - Each tool call is matched against available tools in the bot configuration
   - Tool results are evaluated and returned to the user in Discord

### Implementation Details

1. **Frontend Tool UI**:
   ```typescript
   // Model capabilities detection in useEffect
   useEffect(() => {
     const checkModelCapabilities = async () => {
       try {
         // Ensure we have the latest providers data
         await fetchProviders();

         // Find the selected model in our providers data
         const providers = useLLMModelsStore.getState().providers;
         let foundModel = null;
         for (const provider of providers) {
           const model = provider.models.find((m) => m.id === selectedModel);
           if (model) {
             foundModel = model;
             break;
           }
         }

         // Check if the model supports tool calling
         if (foundModel && foundModel.capabilities) {
           setModelSupportsTools(!!foundModel.capabilities.supports_tool_calling);
         } else {
           setModelSupportsTools(false);
         }
       } catch (error) {
         console.error("Error checking model capabilities:", error);
         setModelSupportsTools(false);
       }
     };

     checkModelCapabilities();
   }, [selectedModel, fetchProviders]);
   ```

2. **Backend Tool Execution**:
   ```typescript
   // Process tool calls if they exist and tools are enabled
   if (response?.toolCalls && response.toolCalls.length > 0) {
     // Only process tool calls if the bot has tool calling enabled in its configuration
     if (bot.configuration?.toolsEnabled) {
       logger.info(`Processing ${response.toolCalls.length} tool calls`);
       
       // Find matching tools from the bot's configuration
       const availableTools = bot.configuration.tools || [];
       
       try {
         // Execute each tool call and map results to original calls
         const toolResults = await executeTools(response.toolCalls, availableTools);
         const toolResultMessages = toolResults.map((result, index) => {
           const originalCall = response.toolCalls[index];
           return evaluateToolResult(result, originalCall);
         });
       } catch (toolError) {
         // Error handling for tool execution
       }
     } else {
       // Inform user that tools are not enabled
       logger.warn(`Model returned tool calls but tools are disabled in bot configuration`);
     }
   }
   ```

### Common Issues & Solutions

1. **Type Errors with Tool Functions**:
   - Always ensure all tool functions are passed their required parameters
   - When iterating through multiple tool calls, map each result to its original call

2. **Configuration Persistence**:
   - Remember to update the `toolsEnabled` flag in the database when the user toggles it
   - Use the full configuration update pattern to ensure nothing is lost

3. **Model Compatibility**:
   - When updating model capabilities, make sure to check for null/undefined
   - Maintain default behavior that assumes a model doesn't support tools unless proven otherwise

### Best Practices

1. **Tool UI Implementation**:
   - Make tool capabilities status clearly visible to users
   - Use conditional rendering based on `modelSupportsTools` state
   - Provide informative messages when tools are disabled

2. **Tool Security**:
   - Always validate tool inputs before execution
   - Implement rate limiting for tool executions
   - Consider sandboxing tool execution for enhanced security

3. **Error Handling**:
   - Implement proper error recovery for tool execution failures
   - Provide meaningful error messages to users
   - Log detailed error information for debugging

### Future Enhancements

The current implementation will be expanded to include:
- Custom tool definition UI for bot owners
- Tool usage analytics and monitoring
- XML-based tool parsing fallback for models that don't natively support tool calling
- Integration with common external services (weather, web search, etc.)

---
