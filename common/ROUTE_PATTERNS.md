# Discura Route Patterns

## Single Source of Truth for Routes

This document explains the pattern used for maintaining a single source of truth for API routes in the Discura project while working within TSOA's limitations.

## The Problem

TSOA cannot resolve imported constants in decorators during the code generation phase. When you use something like:

```typescript
@Route(CONTROLLER_ROUTES.BOTS)
```

TSOA performs static analysis without evaluating the actual value of the constant, which results in `/undefined` routes.

## Our Solution

We've implemented a hybrid approach that maintains a single source of truth while working with TSOA's limitations:

1. **Define all route constants in one place**: `/common/src/types/routes.constants.ts` contains all route string constants.

2. **Use string literals in TSOA decorators**: In controller files, we use string literals that exactly match our constants:

   ```typescript
   // In routes.constants.ts
   export const BASE_ROUTES = {
     BOTS: 'bots',
     // other routes...
   };

   // In bot.controller.ts
   @Route("bots") // Must exactly match BASE_ROUTES.BOTS
   ```

3. **Document the relationship**: Each controller includes comments indicating that the string literals must match the constants.

4. **Export from a central location**: All route constants are exported from `/common/src/types/routes.ts` for use throughout the application.

## Usage Pattern

### 1. In TSOA Controllers

Use string literals in decorators that match the constants:

```typescript
// DON'T do this - TSOA can't resolve it:
// @Route(ROUTES.BOTS)

// DO this - TSOA can process string literals:
@Route("bots")
```

### 2. In Backend Code

Import route constants for programmatic use:

```typescript
import { BASE_ROUTES, BOT_PATHS } from '@discura/common/types/routes';

// Use in code (not decorators):
console.log(`Processing request to ${BASE_ROUTES.BOTS}/${id}`);
```

### 3. In Frontend Code

Import API route constants that include the `/api` prefix:

```typescript
import { API_ROUTES } from '@discura/common/types/routes';

// Use in API calls:
axios.get(API_ROUTES.BOTS.BASE);
axios.get(API_ROUTES.BOTS.BY_ID(botId));
```

## Maintaining the System

When adding new routes:

1. Add the route constant to `/common/src/types/routes.constants.ts`
2. Use the exact same string literal in the corresponding controller's `@Route` decorator
3. Add appropriate documentation comments explaining the relationship

## Why This Approach Works

This approach takes advantage of the fact that:

1. TSOA can reliably process string literals in decorators
2. Our centralized constants file still provides a single source of truth for all code (except TSOA decorators)
3. When we update a route in the constants file, the corresponding string literal in the controller must be updated to match
4. Extensive comments and documentation make it clear to developers that these strings must remain in sync

By following this pattern consistently, we maintain effective route management while working within TSOA's constraints.