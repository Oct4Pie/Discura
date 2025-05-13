#!/bin/bash
set -e

# Store the absolute path to the root directory for easier navigation
ROOT_DIR="$(dirname "$(realpath "$0")")"

rm -rf "$ROOT_DIR/common/src/schema" # Clean up old schema
rm -rf "$ROOT_DIR/frontend/src/api/generated" # Clean up old routes

echo "🔄 Bootstrapping type definitions to break circular dependencies..."
cd "$ROOT_DIR/common"
node scripts/bootstrap-types.js
cd "$ROOT_DIR" # Return to root for tsoa-bootstrap execution

echo "🔨 Generating API schema using TSOA with enhanced module resolution..."
# tsoa-bootstrap.js is now designed to be called from ROOT_DIR
# and internally uses paths relative to ROOT_DIR or common/
node -e "require('./common/scripts/tsoa-bootstrap').generateSpec()"

echo "✅ API schema generated successfully in common/src/schema"

echo "🔄 Synchronizing common types from schema..."
cd "$ROOT_DIR/common"
node scripts/sync-types.js
cd "$ROOT_DIR" # Return to root

echo "🔨 Generating routes with TSOA using enhanced module resolution..."
# tsoa-bootstrap.js for routes generation
node -e "require('./common/scripts/tsoa-bootstrap').generateRoutes()"

echo "✅ Routes generated successfully in common/src/routes"

# echo "🔄 Copying routes to backend src directory for backend compilation..."
# mkdir -p "$ROOT_DIR/backend/src/generated"
# cp -f "$ROOT_DIR/common/src/routes/routes.ts" "$ROOT_DIR/backend/src/generated/routes.ts"

# Build the common package without dependencies on backend files
echo "📦 Building common package with generated types..."
cd "$ROOT_DIR/common"
npx tsc --project tsconfig.json
cd "$ROOT_DIR"

echo "📦 Generating frontend API types..."
cd "$ROOT_DIR/frontend"
npm run generate-types
npm run generate-api
cd "$ROOT_DIR"

echo "🎉 API types generation completed!"
echo ""
echo "📌 IMPORTANT: Use this improved workflow for API types:"
echo "   1. Define API types with @tsoaModel JSDoc in common/src/types/api/"
echo "   2. Run ./generate-api-types.sh"
echo "   3. Import types from common/schema/types.ts in backend"
echo "   4. Import types from frontend/src/api/generated/ in frontend"
echo "   5. Ensure backend imports RegisterRoutes from './generated/routes' (or similar path in src/)"
