#!/bin/bash

# Discura Project - run.sh
# A comprehensive script for building, cleaning, and running the Discura project.
# Created: May 9, 2025

set -e # Exit on error

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to the project root directory
cd "$(dirname "$0")"

# Configuration
FRONTEND_PORT=5173
BACKEND_PORT=3001
PID_FILE=".discura-pids"

# Function to display usage information
function show_help {
    echo -e "${BLUE}Discura Project Run Script${NC}"
    echo ""
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build            Build the project (default command if none specified)"
    echo "  clean            Clean all build artifacts"
    echo "  start           Start the project (backend and frontend)"
    echo "  backend          Start only the backend server"
    echo "  frontend         Start only the frontend dev server"
    echo "  stop             Stop all running services"
    echo "  gen-types        Regenerate API types"
    echo "  help             Show this help message"
    echo ""
    echo "Options:"
    echo "  --no-clean       Skip cleaning when building"
    echo "  --production     Build for production"
    echo "  --skip-common    Skip building the common package"
    echo "  --skip-backend   Skip building the backend package"
    echo "  --skip-frontend  Skip building the frontend package"
    echo ""
    echo "Examples:"
    echo "  ./run.sh                     # Build the entire project"
    echo "  ./run.sh build --no-clean    # Build without cleaning"
    echo "  ./run.sh clean               # Clean all build artifacts"
    echo "  ./run.sh start               # Start backend and frontend"
    echo "  ./run.sh gen-types           # Only generate API types"
}

# Function to clean build artifacts
function clean_builds {
    echo -e "${BLUE}🧹 Cleaning build artifacts...${NC}"
    
    # Clean common package
    echo -e "${YELLOW}Cleaning common package...${NC}"
    cd common && npm run clean
    cd ..
    
    # Clean backend package
    echo -e "${YELLOW}Cleaning backend package...${NC}"
    cd backend && npm run clean
    cd ..
    
    # Clean frontend package
    echo -e "${YELLOW}Cleaning frontend package...${NC}"
    cd frontend && rm -rf dist node_modules/.vite
    cd ..
    
    echo -e "${GREEN}✅ Clean completed successfully.${NC}"
}

# Function to generate API types
function generate_api_types {
    echo -e "${BLUE}📦 Generating API types...${NC}"
    
    # Run the API type generation script
    ./generate-api-types.sh
    
    # Check if generation succeeded
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ API type generation failed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ API types generated successfully.${NC}"
}

# Function to build common package
function build_common {
    echo -e "${BLUE}🔨 Building common package...${NC}"
    
    # Build the common package
    cd common && npm run build
    
    # Check if build succeeded
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Common package build failed!${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}✅ Common package built successfully.${NC}"
}

# Function to build backend package
function build_backend {
    echo -e "${BLUE}🔨 Building backend package...${NC}"
    
    # Build the backend package
    cd backend && npm run build
    
    # Check if build succeeded
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backend build failed!${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}✅ Backend built successfully.${NC}"
}

# Function to build frontend package
function build_frontend {
    echo -e "${BLUE}🔨 Building frontend package...${NC}"
    
    # Build the frontend package
    cd frontend && npm run build
    
    # Check if build succeeded
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend build failed!${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}✅ Frontend built successfully.${NC}"
}

# Function to start backend
function start_backend {
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    cd backend && npm run start &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend-pid
    cd ..
    echo -e "${GREEN}✅ Backend started successfully on port $BACKEND_PORT (PID: $BACKEND_PID).${NC}"
}

# Function to start frontend
function start_frontend {
    echo -e "${BLUE}🚀 Starting frontend development server...${NC}"
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.frontend-pid
    cd ..
    echo -e "${GREEN}✅ Frontend started successfully on port $FRONTEND_PORT (PID: $FRONTEND_PID).${NC}"
}

# Function to stop running services
function stop_services {
    echo -e "${BLUE}👋 Stopping services...${NC}"
    
    if [ -f .backend-pid ]; then
        PID=$(cat .backend-pid)
        if ps -p $PID > /dev/null; then
            kill $PID
            echo -e "${GREEN}✅ Backend stopped (PID: $PID).${NC}"
        else
            echo -e "${YELLOW}⚠️ Backend was not running.${NC}"
        fi
        rm .backend-pid
    fi
    
    if [ -f .frontend-pid ]; then
        PID=$(cat .frontend-pid)
        if ps -p $PID > /dev/null; then
            kill $PID
            echo -e "${GREEN}✅ Frontend stopped (PID: $PID).${NC}"
        else
            echo -e "${YELLOW}⚠️ Frontend was not running.${NC}"
        fi
        rm .frontend-pid
    fi
}

# Parse command and options
COMMAND=${1:-build}
shift || true  # Shift to access options

# Default options
DO_CLEAN=true
PRODUCTION=false
SKIP_COMMON=false
SKIP_BACKEND=false
SKIP_FRONTEND=false

# Parse options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-clean)
            DO_CLEAN=false
            ;;
        --production)
            PRODUCTION=true
            ;;
        --skip-common)
            SKIP_COMMON=true
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Execute command
case "$COMMAND" in
    build)
        echo -e "${BLUE}🏗️  Building Discura project...${NC}"
        
        # Clean if requested
        if [ "$DO_CLEAN" = true ]; then
            clean_builds
        else
            echo -e "${YELLOW}⚠️ Skipping clean phase. Using existing build artifacts.${NC}"
        fi
        
        # Generate API types
        generate_api_types
        
        # Build packages
        if [ "$SKIP_COMMON" != true ]; then
            build_common
        else
            echo -e "${YELLOW}⚠️ Skipping common package build.${NC}"
        fi
        
        if [ "$SKIP_BACKEND" != true ]; then
            build_backend
        else
            echo -e "${YELLOW}⚠️ Skipping backend build.${NC}"
        fi
        
        if [ "$SKIP_FRONTEND" != true ]; then
            build_frontend
        else
            echo -e "${YELLOW}⚠️ Skipping frontend build.${NC}"
        fi
        
        echo -e "${GREEN}✅ Build completed successfully.${NC}"
        ;;
        
    clean)
        clean_builds
        ;;
        
    start)
        stop_services  # Stop any existing services
        echo -e "${BLUE}🚀 Starting Discura...${NC}"
        start_backend
        start_frontend
        echo -e "${GREEN}✅ Discura is now running.${NC}"
        echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop all services.${NC}"
        
        # Function to handle interrupts and stop services
        trap stop_services INT TERM EXIT
        
        # Wait for user interrupt
        echo "Waiting for services to finish..."
        wait
        ;;
        
    backend)
        stop_services  # Stop any existing services
        start_backend
        echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop the server.${NC}"
        
        # Function to handle interrupts and stop services
        trap stop_services INT TERM EXIT
        
        # Wait for user interrupt
        wait
        ;;
        
    frontend)
        stop_services  # Stop any existing services
        start_frontend
        echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop the server.${NC}"
        
        # Function to handle interrupts and stop services
        trap stop_services INT TERM EXIT
        
        # Wait for user interrupt
        wait
        ;;
        
    stop)
        stop_services
        ;;
        
    gen-types)
        generate_api_types
        ;;
        
    help|-h|--help)
        show_help
        ;;
        
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac

exit 0
