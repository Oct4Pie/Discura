**Permanent Coding Instructions:**
You are an expert software developer and architect. Always generate code that is:

- **Clean & Organized:** Structure code logically with consistent naming conventions and a clear project structure. Every module, function, and class should have a well-defined purpose.
- **Modular & Single-Purpose:** Break complex logic into small, single-responsibility components. Each function or class should handle one task effectively to maximize reusability and ease future maintenance.
- **DRY (Don't Repeat Yourself):** Never duplicate code. Before adding new functions, classes, or modules, verify if similar functionality already exists in the workspace. Reuse and integrate with existing code rather than writing new, overlapping code. Remove redundant or dead code during refactoring.
- **Simple & Maintainable:** Favor straightforward, efficient solutions that adhere to the KISS and YAGNI principles. Avoid over-engineering and unnecessary complexity; choose the simplest, most cohesive approach when multiple solutions are possible.
- **Token-Efficient:** Write self-explanatory code that minimizes reliance on excessive inline comments or documentation by using descriptive naming and clear structure.
- **Thorough & Relentless Execution:** Do **not** be lazy or cut corners. Provide full, complete code for every task. Always generate as much working, relevant code as needed—do not leave placeholders or incomplete implementations.
- **Persistent Follow-Through:** Continue working through the task **until it is fully completed**. Never stop mid-way, and never interrupt the task loop prematurely. Keep iterating, improving, or asking for clarification until the job is 100% done.

**Task Management**: This instruction file is at the project's /.github/copilot-instructions.md. As you switch between tasks/objectives, keep notes and memory under "Current Tasks" so you may resume in other sessions without losing much of your objectives.

**Additional Guidance:**
- Always consider the overall impact on the codebase before adding or modifying functionality. Strive for consistency across all modules.
- In ambiguous situations or when multiple approaches seem viable, analyze the existing project structure first and ask for clarification if needed to ensure seamless integration.
- Regularly verify that no redundant, conflicting, or deprecated code exists; proactively refactor to maintain code health.
- Remember: maintainability, clarity, and efficiency are paramount. Aim to meet immediate requirements while ensuring the codebase remains healthy and adaptable for future changes.

**Architecture Principles:**
- **API Route Structure:** 
  - Backend routes should NOT include `/api` prefix (use `/auth/discord`, `/bots/:id`, etc.)
  - Frontend requests use `/api` prefix (e.g., `/api/auth/discord`) which Vite proxies to the backend
  - The Vite proxy should strip the `/api` prefix before forwarding requests to the backend
- **Single Source of Truth:** 
  - NEVER, EVER hard-code paths, schemas, or configurations in places other than generation files.
  - ONLY USE code generation for API clients, schemas, and types
  - Common types MUST be defined once and shared between frontend and backend
  - Configuration values MUST be derived from environment variables or centralized config files
- **Frontend-Backend Communication:**
  - Frontend communicates with backend exclusively through the Vite proxy
  - Direct cross-origin API calls between frontend and backend are prohibited
  - Backend URLs should never be hard-coded in frontend code

**Project Instructions:**
We are making a platform named Discura that runs locally and allows users to make discord bots that work in conjunction with LLM endpoints (OpenAI compatible for now). The bots use the endpoints to generate responses, images, and function calling when interacting with users on discord, so they are just like bots powered by LLMs in the backend.

The platform has a web interface where users can log in via discord auth. Users are guided to go to discord applications, make bots, enable required intents, and provide the token. Required fields like name and token are needed.

Then the bot will be instantiated and starts running. Users can make as many bots as they wish. It should handle multiple bots and users using the platform at the same time.

Now, when bots are active and many settings that can be configured. Now users can set system prompts, personality, traits, backstory, the LLM to use, etc. etc. Other settings can include knowledge (what the bot should know in context) and useful settings. Settings for image generation, tool usage and definition, etc. are also needed as they will be implemented as moving forward

Simply: it is just like a web interface for making custom social/roleplay agents (bots) on discord that can chat with users in DMs and servers and make it a fun experience while following their traits and personality.

Of course the system must be clean and robust to work perfectly.

**Project Info (Updated May 2025):**

## Architecture Overview
Discura is a full-stack application with three main components:
1. **Backend**: Node.js/Express server (MongoDB, SQLite migration in progress)
2. **Frontend**: React + Material UI
3. **Common**: Shared types/utilities between frontend and backend

## Backend Structure
- **TSOA Integration:**
  - API routes and docs via TSOA decorators
  - Controllers in `src/controllers/tsoa/`
  - Only non-TSOA routes in `routes/index.ts`
- **Models:**
  - Mongoose models for User/Bot (MongoDB)
  - Adapters/repositories for SQLite (migration ongoing)
- **Services:**
  - `bot.service.ts`: Discord bot lifecycle
  - `message.service.ts`: Discord message/interaction handling (supports messages, reactions, slash commands, buttons, modals, context menus, autocomplete)
  - `llm.service.ts`: LLM integration (OpenAI ONLY for now)
  - `image.service.ts`: Image generation (OpenAI-compatible APIs, ALL OTHER ONES SHOULD BE MARKED WITH "Coming Soon")
  - `tool.service.ts`: Tool/function calling for bots
- **Authentication:**
  - Discord OAuth via passport-discord
  - User model supports Discord profile fields
- **Database:**
  - MongoDB primary, SQLite support being added (adapters, repositories, migration in progress)

## Frontend Structure
- **React + Material UI**
- **Pages:** Auth, Bot List, Bot Detail, Settings, etc.
- **State:** Zustand
- **API:** Uses OpenAPI-generated client from common types/schema

## Type Generation & Sharing
- **Single Source of Truth:**
  - All API types in `common/src/types/api.ts`
  - TSOA controllers and frontend import from common
  - `generate-api-types.sh` and `sync-types.js` keep types in sync

## Key Data Structures
- **Bot Configuration:**
  - System prompt, personality, traits, backstory
  - LLM provider/model/key
  - Knowledge base items
  - Image generation settings
  - Tool/function calling config
- **Bot Status:**
  - ONLINE, OFFLINE, ERROR
  - Start/stop per user/bot

## API Workflow
- **Auth:** Discord OAuth
- **Bot Management:** CRUD, start/stop, invite link
- **Bot Config:** Update system prompt, traits, LLM, etc.
- **Knowledge Base:** CRUD for bot knowledge
- **Image Generation:** (UI and backend in progress)
- **Tool/Function Calling:** (Framework in place, more tools to be added)

## Type Synchronization
- **DRY:**
  - Common package is the single source of truth for all API types
  - TSOA and frontend import from common
  - Types only defined once and shared

## Known Patterns
- **Mongoose & TypeScript:**
  - Use type assertions and optional chaining for Mongoose docs
  - Interfaces extend both domain model and Mongoose.Document
- **TSOA:**
  - Only TSOA controllers in `src/controllers/tsoa/`
  - No manual registration of TSOA routes
- **Adapters:**
  - Adapters bridge MongoDB models and SQLite repositories for migration

## Current Limitations/Issues
- Validation/error handling should be improved
- TypeScript config supports project references but needs refinement
- SQLite migration ongoing; proper typing addressed, but feature parity is still in progress

**Current Tasks (May 2025):**
1. **Core Bot Management** ✅
   - Multi-bot/user support, robust CRUD, TypeScript fixes completed for MongoDB to SQLite migration
   - Fixed type issues with repository return types (null vs. undefined)
   - Fixed BotDetailResponseDto compatibility in controllers
2. **Type Safety Improvements** ✅
   - Resolved TypeScript errors in bot.controller.ts, bot.adapter.ts
   - Fixed knowledge array item ID issues (generated UUIDs for missing IDs)
   - Standardized image generation provider types to maintain compatibility with ImageGenerationConfig
   - Added adapter functions for safe type conversion between different parts of the system
3. **Discord Integration** ✅/⏳
   - Auth flow, interaction types (messages, reactions, commands, buttons, modals, context menus, autocomplete)
   - Invite link generation with proper scopes and permissions
   - Error handling for partial reaction objects and edge cases
4. **Database Migration** ⏳
   - MongoDB to SQLite migration in progress
   - Adapter pattern implemented (BotAdapter, UserAdapter)
   - Fixed issues with repository return types (standardized on undefined instead of null)
5. **Image Generation Standardization** ✅
   - Standardized on OpenAI-compatible APIs for image generation (ONLY OpenAI now)
   - Fixed typing issues with provider configuration
   - Improved adaptImageGenerationConfig to properly handle provider type conversion
6. **Tool/Function Calling** ⏳
   - Framework in place with proper error handling for toolCalls
   - Type-safe tool execution implemented with adapter pattern
   - Added placeholder implementations for tools without explicit implementation
7. **LLM Integration** ⏳
   - Multi-provider support, improved error handling, adapter pattern implemented
   - Updated callLLM interface with better error handling and proper type safety
   - Support for OpenAI ONLY
8. **Bot Configuration UI** ⏳
   - Personality, system prompt, traits, backstory, knowledge base UI, templates/examples
9. **Knowledge Base Management** ✅
   - CRUD operations, type definition fixes, error handling for DTO conversions
   - Fixed issues with required vs. optional knowledge item fields
10. **Project Setup & Initialization** ✅
    - Created robust initialization script (init.js) for automatic setup
    - Fixed directory structure for database storage
    - Implemented proper environment configuration management
    - Enhanced type generation pipeline with support for both YAML and JSON schemas
11. **API Type Generation** ✅
    - Fixed issues with swagger.json/yaml schema generation
    - Enhanced sync-types.js to handle both formats properly
    - Complete end-to-end type safety from backend to frontend
12. **Frontend-Backend Communication** ✅
    - Implemented Vite proxy configuration for secure API communication
    - Replaced direct API calls (with separate ports) with proxied calls
    - Improved authentication flow to prevent redirect loops
    - Created centralized API service with proper error handling and token management
13. **Error Handling & Debugging** ✅
    - Fixed frontend TypeScript errors related to imports and types
    - Updated imports to use OpenAPI-generated schemas correctly
    - Added consistent error handling for API responses
    - Improved debugging support with better error messages
14. **Routing & Navigation** ✅
    - Added support for /dashboard route
    - Fixed authentication redirects
    - Improved route protection for authenticated users
    - Updated layout components to handle navigation consistently
15. **API Route Structure Standardization** ✅
    - Ensured backend routes don't use `/api` prefix
    - Configured Vite proxy to strip `/api` prefix before forwarding requests to backend
    - Updated frontend to consistently use `/api` prefix for all backend requests
    - Fixed Discord OAuth flow to work with the Vite proxy pattern

---

**Note**: NEVER encode hard coded paths, schema, etc. ABSOLUTELY NO hard-coded paths, schema, etc. should exist in files other than the generation files. EVERYTHING of such nature must be generated to keep ONLY and ONLY a single source of truth.

**If you switch tasks, update the "Current Tasks" section above with notes and memory so you can resume later.**

Ensure: ABSOLUTELY NO hard-coded paths, schema, etc. exist in files other than the generation files.