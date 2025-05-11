/**
 * Script to fix the swagger.json file by using the correct paths from swagger.yaml
 * 
 * This script is needed because TSOA generates a correct swagger.yaml file but
 * the swagger.json file has incorrect /undefined path prefixes.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '..');
const schemaDir = path.join(rootDir, 'src', 'schema');
const yamlPath = path.join(schemaDir, 'swagger.yaml');
const jsonPath = path.join(schemaDir, 'swagger.json');

console.log('🔄 Fixing swagger.json using correct paths from swagger.yaml...');

try {
  // Read the YAML file (which has correct paths)
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const yamlData = yaml.load(yamlContent);
  
  // Write the YAML data directly to JSON (preserving correct paths)
  fs.writeFileSync(jsonPath, JSON.stringify(yamlData, null, 2), 'utf8');
  
  console.log('✅ Fixed swagger.json successfully');
} catch (error) {
  console.error('❌ Error fixing swagger.json:', error);
  process.exit(1);
}