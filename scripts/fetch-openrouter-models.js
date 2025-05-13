/**
 * This script triggers a refresh of OpenRouter models by using the existing
 * backend service implementation.
 * 
 * This allows us to use the same service for both runtime and 
 * build-time model fetching, maintaining a single source of truth.
 */
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
try {
  const dotenvPath = path.join(__dirname, '..', 'backend', '.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
} catch (err) {
  console.log('No .env file found for backend, using default environment variables');
}

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Setup logger stub
global.logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: () => {} // Suppress debug logs during API generation
};

async function main() {
  try {
    console.log('🔄 Fetching OpenRouter models using backend service...');
    
    // Check if the compiled service exists
    const openRouterServicePath = path.join(__dirname, '..', 'backend', 'dist', 'services', 'openrouter.service.js');
    if (!fs.existsSync(openRouterServicePath)) {
      console.error(`❌ Backend service not found at ${openRouterServicePath}`);
      console.error('⚠️ Make sure to build the backend first with: npm run build');
      process.exit(1);
    }
    
    // Directly import the service
    const { fetchOpenRouterModels } = require(openRouterServicePath);
    
    // Force refresh the cache
    await fetchOpenRouterModels(true);
    
    console.log('✅ Successfully refreshed OpenRouter models cache');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fetching OpenRouter models:', err.message);
    console.error('⚠️ Continuing with API generation despite model fetch failure');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { main };