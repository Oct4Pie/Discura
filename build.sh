#!/bin/bash

# Build script for Discura

# Build common package
echo "Building common package..."
cd common
npm run build

# Build backend
echo "Building backend..."
cd ../backend
npm run build

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build

echo "Build completed successfully!"
