const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Regex to find imports from common package
const importRegex = /from\s+['"]common\/([^'"]+)['"]/g;

// Function to walk through the directory and find all TypeScript files
async function findTsFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        fileList = await findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Function to update imports in a file
async function updateFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    
    // Replace the imports
    const matches = content.match(importRegex);
    if (matches) {
      console.log(`Updating imports in: ${filePath}`);
      updatedContent = content.replace(importRegex, 'from \'@discura/common/$1\'');
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`  Updated ${matches.length} import(s) in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('Finding TypeScript files in backend...');
    const backendFiles = await findTsFiles(path.join(__dirname, '..', 'backend', 'src'));
    console.log(`Found ${backendFiles.length} TypeScript files in backend`);
    
    console.log('Finding TypeScript files in frontend...');
    const frontendFiles = await findTsFiles(path.join(__dirname, '..', 'frontend', 'src'));
    console.log(`Found ${frontendFiles.length} TypeScript files in frontend`);
    
    const allFiles = [...backendFiles, ...frontendFiles];
    console.log(`Updating imports in ${allFiles.length} files...`);
    
    for (const file of allFiles) {
      await updateFile(file);
    }
    
    console.log('Import update complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
