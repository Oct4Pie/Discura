#!/bin/bash
set -e

echo "🔨 Building backend to generate API schema..."
cd "$(dirname "$0")/backend"
npm run build:tsoa

echo "✅ API schema generated successfully in common/src/schema"

echo "🔄 Synchronizing common types from schema..."
cd ../common
npm run sync-types

echo "📦 Generating frontend API types..."
cd ../frontend
npm run generate-types
npm run generate-api

echo "🎉 API types generation completed!"
