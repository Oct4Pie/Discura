#!/usr/bin/env node

/**
 * Discura Application Initialization
 * 
 * This script performs essential setup tasks before running the application:
 * 1. Ensures database directories exist
 * 2. Validates required configuration files
 * 3. Verifies type generation is complete
 * 4. Creates SQLite database file if it doesn't exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { mkdirp } = require('mkdirp'); // Fixed import syntax for mkdirp

// Configuration paths
const CONFIG_PATHS = {
  DATABASE_DIR: path.join(__dirname, 'data'),
  BACKEND_DATABASE_DIR: path.join(__dirname, 'backend', 'data'),
  SQLITE_DB_PATH: path.join(__dirname, 'data', 'discura.db'),
  BACKEND_DB_PATH: path.join(__dirname, 'backend', 'data', 'discura.db'),
  ENV_FILE: path.join(__dirname, '.env'),
  ENV_EXAMPLE: path.join(__dirname, '.env.example')
};

// Color console output for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log formatted message to console
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (type) {
    case 'success':
      prefix = `${colors.green}[SUCCESS]${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}[ERROR]${colors.reset}`;
      break;
    case 'warning':
      prefix = `${colors.yellow}[WARNING]${colors.reset}`;
      break;
    default:
      prefix = `${colors.blue}[INFO]${colors.reset}`;
  }
  
  console.log(`${prefix} ${message}`);
}

/**
 * Ensure all required directories exist
 */
async function ensureDirectories() {
  log('Checking required directories...');
  
  try {
    // Create main data directory
    if (!fs.existsSync(CONFIG_PATHS.DATABASE_DIR)) {
      await mkdirp(CONFIG_PATHS.DATABASE_DIR);
      log(`Created data directory at ${CONFIG_PATHS.DATABASE_DIR}`, 'success');
    }
    
    // Create backend data directory
    if (!fs.existsSync(CONFIG_PATHS.BACKEND_DATABASE_DIR)) {
      await mkdirp(CONFIG_PATHS.BACKEND_DATABASE_DIR);
      log(`Created backend data directory at ${CONFIG_PATHS.BACKEND_DATABASE_DIR}`, 'success');
    }
    
    // Create symbolic link for the database file
    try {
      if (fs.existsSync(CONFIG_PATHS.SQLITE_DB_PATH)) {
        if (!fs.existsSync(CONFIG_PATHS.BACKEND_DB_PATH)) {
          // Create a symbolic link from the backend directory to the main data directory
          fs.symlinkSync(CONFIG_PATHS.SQLITE_DB_PATH, CONFIG_PATHS.BACKEND_DB_PATH);
          log(`Created symbolic link for database at ${CONFIG_PATHS.BACKEND_DB_PATH}`, 'success');
        }
      }
    } catch (linkError) {
      log(`Warning: Could not create database symbolic link: ${linkError.message}`, 'warning');
      log('The application will use separate database files. This may cause data inconsistencies.', 'warning');
    }
    
    log('All required directories exist', 'success');
    return true;
  } catch (error) {
    log(`Failed to create directories: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Check for .env file and create from example if it doesn't exist
 */
function checkEnvironmentFile() {
  log('Checking environment configuration...');
  
  if (!fs.existsSync(CONFIG_PATHS.ENV_FILE)) {
    if (fs.existsSync(CONFIG_PATHS.ENV_EXAMPLE)) {
      try {
        fs.copyFileSync(CONFIG_PATHS.ENV_EXAMPLE, CONFIG_PATHS.ENV_FILE);
        log('.env file created from .env.example', 'success');
        log(`${colors.yellow}NOTE:${colors.reset} Make sure to update .env with your specific configuration!`, 'warning');
      } catch (error) {
        log(`Failed to create .env file: ${error.message}`, 'error');
        return false;
      }
    } else {
      log('.env file not found and no .env.example to copy from', 'error');
      log('Please create a .env file with appropriate configuration');
      return false;
    }
  }
  
  return true;
}

/**
 * Generate API types
 */
function generateApiTypes() {
  log('Generating API types...');
  
  try {
    execSync('./generate-api-types.sh', { stdio: 'inherit' });
    log('API types generated successfully', 'success');
    return true;
  } catch (error) {
    log('Failed to generate API types', 'error');
    log('You may need to run "npm run build-types" manually');
    return false;
  }
}

/**
 * Build common package
 */
function buildCommonPackage() {
  log('Building common package...');
  
  try {
    process.chdir(path.join(__dirname, 'common'));
    execSync('npm run build', { stdio: 'inherit' });
    process.chdir(__dirname);
    log('Common package built successfully', 'success');
    return true;
  } catch (error) {
    log('Failed to build common package', 'error');
    log('You may need to run "cd common && npm run build" manually');
    process.chdir(__dirname);
    return false;
  }
}

/**
 * Install packages across all projects if node_modules is missing
 */
async function checkNodeModules() {
  const projects = ['', 'backend', 'common', 'frontend'];
  let allSuccess = true;
  
  for (const project of projects) {
    const projectPath = path.join(__dirname, project);
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      log(`Installing dependencies for ${project || 'root'}...`);
      try {
        process.chdir(projectPath);
        execSync('npm install', { stdio: 'inherit' });
        log(`Dependencies installed for ${project || 'root'}`, 'success');
      } catch (error) {
        log(`Failed to install dependencies for ${project || 'root'}: ${error.message}`, 'error');
        allSuccess = false;
      }
    }
  }
  
  process.chdir(__dirname);
  return allSuccess;
}

/**
 * Main initialization function
 */
async function init() {
  log(`${colors.cyan}=== Discura Initialization ====${colors.reset}`);
  
  // Make sure node_modules exists in all projects
  const modulesResult = await checkNodeModules();
  if (!modulesResult) {
    log('Some dependencies could not be installed. Try running npm install manually in each directory.', 'warning');
  }
  
  // Create required directories
  const dirResult = await ensureDirectories();
  if (!dirResult) {
    log('Failed to create required directories. Make sure you have write permissions.', 'error');
    process.exit(1);
  }
  
  // Check for environment configuration
  const envResult = checkEnvironmentFile();
  if (!envResult) {
    log('Environment configuration issues detected.', 'warning');
  }
  
  // Generate API types
  const typesResult = generateApiTypes();
  if (!typesResult) {
    log('API types generation failed. This may cause type errors in the application.', 'warning');
  }
  
  // Build common package
  const commonResult = buildCommonPackage();
  if (!commonResult) {
    log('Common package build failed. This may cause dependency issues.', 'warning');
  }
  
  log(`${colors.cyan}=== Initialization Complete ====${colors.reset}`);
  log('You can now start the application with: npm run dev');
}

// Run initialization
init().catch(error => {
  log(`Unhandled error during initialization: ${error.message}`, 'error');
  process.exit(1);
});