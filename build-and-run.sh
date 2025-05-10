#!/bin/bash

# Discura build and run script
# This script will clean builds, generate API types, build packages, and run the project

# Change to the project root directory
cd "$(dirname "$0")"

echo "🧹 Cleaning builds..."
# Clean common, backend and frontend builds
cd common && npm run clean
cd ../backend && npm run clean
cd ../frontend && rm -rf dist node_modules/.vite
cd ..

echo "📦 Generating API types..."
# Run the API type generation script
./generate-api-types.sh

echo "🔨 Building common package..."
# Build the common package
cd common && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Common package build failed!"
    exit 1
fi

echo "🔨 Building backend package..."
# Build the backend package
cd ../backend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

echo "🚀 Starting backend and frontend..."
# Start backend and frontend in parallel
cd ../backend && npm run start &
BACKEND_PID=$!

cd ../frontend && npm run dev &
FRONTEND_PID=$!

# Handle Ctrl+C and other signals
function cleanup {
  echo -e "\n👋 Stopping services..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID 2>/dev/null
  wait $FRONTEND_PID 2>/dev/null
  echo "✅ All processes terminated"
  exit
}

trap cleanup INT TERM EXIT

# Wait for processes to finish (they should run forever unless interrupted)
wait $BACKEND_PID $FRONTEND_PID
