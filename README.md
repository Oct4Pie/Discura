# Discura

Discura is a platform that lets you create and manage Discord bots powered by Large Language Models (LLMs). It runs locally and provides an intuitive web interface for configuring, deploying, and monitoring your bots.

## Features

- **Discord Integration**: Seamlessly connect with Discord's API to create interactive bots
- **LLM Integration**: Connect to OpenAI, Anthropic, Google, or custom LLM providers
- **Bot Personality**: Customize your bot's personality, traits, and backstory
- **Image Generation**: Enable image generation capabilities powered by DALL-E, Stability AI, or Midjourney
- **Knowledge Management**: (Coming Soon) Add custom knowledge sources to make your bot more informed
- **Tools & Functions**: (Coming Soon) Give your bot access to external tools and data sources

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- Discord Application & Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discura.git
cd discura
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install common dependencies
cd ../common
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Add your Discord client ID and secret
   - Set your MongoDB connection string

4. Build the project:
```bash
# From the project root
./build.sh
```

5. Start the application:
```bash
# Start MongoDB (if running locally)
mongod --dbpath /path/to/data/directory

# Start the backend
cd backend
npm start

# In another terminal, start the frontend
cd frontend
npm run dev
```

6. Open your browser and navigate to http://localhost:5173

## Usage

1. Log in with your Discord account
2. Create a new bot by connecting to a Discord application
3. Configure your bot's personality and LLM settings
4. Start your bot and invite it to your Discord server

## Docker Deployment

You can also use Docker to deploy Discura:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## Architecture

Discura consists of three main components:

- **Backend**: Node.js/Express server that handles authentication, bot management, and Discord integration
- **Frontend**: React application providing the user interface
- **Common**: Shared TypeScript types and utilities

## Controller Injection Architecture

The project uses a controller injection mechanism to enable backend-specific implementations of TSOA controllers defined in the common package. This architecture follows the "define once, implement many times" pattern:

### Architecture Overview

1. **Common Package**: Defines API contracts using TSOA controllers with placeholder implementations
2. **Backend Package**: Implements the actual controller logic
3. **TSOA Routes**: Generated from common package controllers
4. **Controller Injection**: Runtime mechanism to use backend implementations with TSOA-generated routes

### How Controller Injection Works

The controller injection mechanism in `backend/src/utils/tsoa-controller-injection.ts` ensures that TSOA-generated routes use the backend implementations instead of the placeholder implementations in the common package:

```typescript
// Key steps in the injection process:
1. Find all backend controller implementations
2. Directly patch methods on the common controller prototypes
3. Bind method implementations to backend controller instances
4. Register the injection before TSOA routes are used
```

When the backend server starts:
1. Backend controller implementations are instantiated
2. Common controller prototype methods are replaced with methods from backend implementations
3. TSOA routes are registered, now pointing to backend implementations
4. Original constructors are restored to avoid memory leaks

### Implementation Notes

- Common controllers throw `"Method not implemented in common package"` errors in their placeholder implementations
- Backend controllers extend or implement the common controller interfaces
- The injection happens at runtime through prototype patching rather than compile-time
- Debug logs are available to trace which methods are being patched

### Troubleshooting Controller Injection

If you see `"Method not implemented in common package"` errors:
1. Check that backend controllers properly implement all methods from common controllers
2. Verify controller injection is running before routes are registered
3. Check the debug logs to confirm methods are being patched
4. Ensure backend controller method signatures match common controller definitions

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

5. **Provider Enum Syncing**: When modifying the `LLMProvider` enum in `common/src/types/api/llm.ts`, always update the corresponding `LlmProviderConstants` interface in `common/src/types/api/constants.ts` to maintain synchronization between the two. This ensures type safety when using constants in the frontend.

### Provider Integration Architecture

// ...existing code...

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
